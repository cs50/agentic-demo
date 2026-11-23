/**
 * Layout audit: load every slide at every click state and report anything
 * that is cut off. Catches what a glance at the final state misses.
 *
 *   pnpm audit:layout                 # expects a dev server on :3031
 *   pnpm audit:layout -- 3030         # or any other port
 *   pnpm audit:layout -- 3031 36-50   # only slides 36 to 50 (or a single "32")
 *
 * Checks, per slide and per click:
 *   1. the slide root is not scrollable (content fits the frame)
 *   2. no element that clips its content (overflow hidden/auto/scroll/clip)
 *      has content larger than itself, except intentional scrollers
 *   3. no visible text sits outside the slide frame
 *
 * Uses real navigation (page.goto) for each click state, because pushing a
 * `?clicks=` URL into the running app does not reliably apply the clicks,
 * and waits for CSS transitions to settle before measuring.
 *
 * Exit code 1 if anything is clipped, so this can gate a release.
 */
import { chromium } from 'playwright-chromium'

const args = process.argv.slice(2).filter((a) => a !== '--') // pnpm forwards the separator
const port = args[0] ?? '3031'
const base = `http://localhost:${port}`
const range = args[1] // e.g. "36-50" or "32"
const [rangeFrom, rangeTo] = range ? range.split('-').map(Number) : [1, Infinity]

/** Elements that scroll or clip by design. Keep this list short and explicit. */
const INTENTIONAL = ['.scroller', '.turns', '.events', '.artifacts', '.ls-body', '.le-editor', '.monaco-editor', '.tip-bubble']

const browser = await chromium.launch()
let page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

/** A headless renderer can die mid-run; start a fresh page and carry on. */
async function freshPage() {
  try { await page.close() } catch {}
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
}

async function slideCount(): Promise<number> {
  await page.goto(`${base}/1`, { waitUntil: 'load' })
  await page.waitForSelector('.slidev-page-1 .slidev-layout', { timeout: 20000 })
  await page.waitForTimeout(500)
  return page.evaluate(() => {
    const t = document.body.innerText.match(/\d+\s*\/\s*(\d+)/)
    return t ? Number(t[1]) : 0
  })
}

async function clicksFor(n: number): Promise<number> {
  await page.goto(`${base}/${n}`, { waitUntil: 'load' })
  await page.waitForSelector(`.slidev-page-${n} .slidev-layout`, { timeout: 20000 })
  await page.waitForTimeout(400)
  // Press → until the slide changes; the count before the change is the slide's clicks.
  let k = 0
  for (; k < 20; k++) {
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(220)
    if (!page.url().includes(`/${n}`)) break
  }
  return k
}

interface Finding {
  slide: number
  click: number
  kind: 'root' | 'clip' | 'outside'
  what: string
  by: string
}

async function audit(n: number, c: number): Promise<Finding[]> {
  await page.goto(`${base}/${n}?clicks=${c}`, { waitUntil: 'load' })
  await page.waitForSelector(`.slidev-page-${n} .slidev-layout`, { timeout: 20000 })
  await page.waitForTimeout(900) // let enter/width transitions finish
  return page.evaluate(
    ({ n, c, INTENTIONAL }) => {
      const out: Finding[] = []
      const pg = document.querySelector(`.slidev-page-${n}`)
      if (!pg) return [{ slide: n, click: c, kind: 'root', what: 'slide not found', by: '' } as Finding]
      const layout = pg.querySelector('.slidev-layout') as HTMLElement
      const frame = layout.getBoundingClientRect()
      const name = (el: Element) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').slice(0, 2).join('.')}`
      const text = (el: Element) => (el as HTMLElement).innerText?.trim().replace(/\s+/g, ' ').slice(0, 40) ?? ''

      const rdy = layout.scrollHeight - layout.clientHeight
      const rdx = layout.scrollWidth - layout.clientWidth
      if (rdy > 2 || rdx > 2) out.push({ slide: n, click: c, kind: 'root', what: 'slide content overflows the frame', by: `${rdy}px down, ${rdx}px across` })

      const hiddenByAncestor = (el: Element) => {
        for (let a: Element | null = el; a && a !== pg; a = a.parentElement) {
          const s = getComputedStyle(a)
          if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return true
        }
        return false
      }

      for (const el of pg.querySelectorAll<HTMLElement>('*')) {
        if (INTENTIONAL.some((s) => el.matches(s) || el.closest(s))) continue
        if (hiddenByAncestor(el)) continue // not yet revealed: the viewer can't see it, clipped or not
        const cs = getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue

        // 2. clips its own content
        const clipY = /hidden|auto|scroll|clip/.test(cs.overflowY)
        const clipX = /hidden|auto|scroll|clip/.test(cs.overflowX)
        if (clipY || clipX) {
          const dy = el.scrollHeight - el.clientHeight
          const dx = el.scrollWidth - el.clientWidth
          if ((clipY && dy > 2) || (clipX && dx > 2))
            out.push({ slide: n, click: c, kind: 'clip', what: `${name(el)} "${text(el)}"`, by: `${Math.max(dy, 0)}px down, ${Math.max(dx, 0)}px across` })
        }

        // 2b. a box wider or taller than the slot its parent gave it (it will paint
        //     over a sibling, e.g. a flex item that cannot shrink below its content)
        if (el.children.length > 0 && !(el instanceof SVGElement)) {
          const parent = el.parentElement!
          const ps = getComputedStyle(parent)
          if (ps.display !== 'contents' && !/absolute|fixed/.test(cs.position)) {
            const pr = parent.getBoundingClientRect()
            const over = Math.max(rect.right - pr.right, pr.left - rect.left, rect.bottom - pr.bottom, pr.top - rect.top)
            if (over > 1.5)
              out.push({ slide: n, click: c, kind: 'clip', what: `${name(el)} "${text(el)}"`, by: `${Math.round(over)}px larger than its slot (will overlap a neighbour)` })
          }
        }

        // 3. text outside the frame, or spilling out of its own parent (an inline
        //    span has no clientWidth, so compare geometry rather than scroll metrics)
        if (el.children.length === 0 && text(el)) {
          if (rect.right > frame.right + 1 || rect.bottom > frame.bottom + 1 || rect.left < frame.left - 1 || rect.top < frame.top - 1)
            out.push({ slide: n, click: c, kind: 'outside', what: `${name(el)} "${text(el)}"`, by: 'extends past the slide frame' })
          else if (!/absolute|fixed/.test(cs.position)) {
            const parent = el.parentElement!
            const pr = parent.getBoundingClientRect()
            const over = Math.max(rect.right - pr.right, pr.left - rect.left)
            // 4px: bold glyphs' ink can exceed the line box by a pixel or two
            if (over > 4 && getComputedStyle(parent).display !== 'contents')
              out.push({ slide: n, click: c, kind: 'clip', what: `${name(el)} "${text(el)}"`, by: `text ${Math.round(over)}px wider than its box` })
          }
        }
      }
      return out
    },
    { n, c, INTENTIONAL },
  )
}

const total = await slideCount()
console.log(`Auditing ${total} slides on ${base}`)
const findings: Finding[] = []
for (let n = Math.max(1, rangeFrom); n <= Math.min(total, rangeTo ?? rangeFrom); n++) {
  let clicks = 0
  try {
    clicks = await clicksFor(n)
    for (let c = 0; c <= clicks; c++) findings.push(...(await audit(n, c)))
  } catch (e) {
    findings.push({ slide: n, click: -1, kind: 'root', what: 'audit failed', by: String((e as Error).message).split('\n')[0] })
    await freshPage()
  }
  process.stdout.write(`\r  slide ${n}/${total} (${clicks} clicks)   `)
}
console.log()
await browser.close()

if (!findings.length) {
  console.log('No clipping found.')
  process.exit(0)
}
// Collapse repeats across clicks: report each (slide, kind, what) once with the clicks it appears at.
const grouped = new Map<string, { f: Finding; clicks: number[] }>()
for (const f of findings) {
  const key = `${f.slide}|${f.kind}|${f.what}`
  const g = grouped.get(key) ?? { f, clicks: [] }
  g.clicks.push(f.click)
  grouped.set(key, g)
}
console.log(`${grouped.size} problem(s):`)
for (const { f, clicks } of grouped.values())
  console.log(`  slide ${f.slide} @clicks ${clicks.join(',')}: [${f.kind}] ${f.what} — ${f.by}`)
process.exit(1)
