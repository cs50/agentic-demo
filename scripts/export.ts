/**
 * export.ts — `pnpm export`: the deck as a PDF, the way it should read on paper.
 *
 * Two things in a slide's frontmatter steer it:
 *
 *   export: false            leave the slide out (the join slides: a QR code and a
 *                            live headcount mean nothing in a PDF)
 *   exportClicks: [0, 2, 4]  include these click states, in this order, instead of
 *                            the finished state alone (the hook: the chart, then
 *                            the Prompt Index, then English drawn on the chart)
 *
 * Everything else appears once, at its finished state.
 *
 * Slidev's own exporter offers either all-finished or every-click-of-every-slide,
 * and in 53.1 its --range is not applied, so this renders the deck itself the way
 * Slidev's one-piece export does: start Slidev's server in export mode, open its
 * print page with every click of every slide laid out, hide the pages that are
 * not wanted, and print what is left to one PDF. One pass, a few seconds.
 *
 *   pnpm export                      → slides-export.pdf
 *   pnpm export -- --output deck.pdf
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createServer, resolveOptions } from '@slidev/cli'
import { parseSync } from '@slidev/parser'
import { PDFDocument } from 'pdf-lib'
import { chromium } from 'playwright-chromium'

const root = resolve(import.meta.dirname, '..')
const outIndex = process.argv.indexOf('--output')
const output = resolve(root, outIndex > 0 ? process.argv[outIndex + 1] : 'slides-export.pdf')
const WIDTH = 1920
const HEIGHT = 1080

// ------------------------------------------------------------- the plan

const entry = join(root, 'slides.md')
const { slides } = parseSync(readFileSync(entry, 'utf8'), entry)

/** Per slide number: null = left out; [] = finished state only; [n, …] = those clicks. */
const plan = new Map<number, number[] | null>()
const skipped: string[] = []
slides.forEach((s, i) => {
  const no = i + 1
  const title = String(s.title ?? s.frontmatter.title ?? 'untitled')
  if (s.frontmatter.export === false) {
    plan.set(no, null)
    skipped.push(`${no} (${title})`)
    return
  }
  const clicks = s.frontmatter.exportClicks
  if (clicks === undefined) {
    plan.set(no, [])
    return
  }
  if (!Array.isArray(clicks) || !clicks.every((c) => Number.isInteger(c) && c >= 0)) {
    throw new Error(`slide ${no}: exportClicks must be a list of click numbers, got ${JSON.stringify(clicks)}`)
  }
  plan.set(no, clicks)
})
console.error(`${slides.length - skipped.length} of ${slides.length} slides; left out: ${skipped.join(', ') || 'none'}`)

// ------------------------------------------------------------- render

const options = await resolveOptions({ entry }, 'export')
const port = 18724 + Math.floor(Math.random() * 1000)
const server = await createServer(options, { server: { port }, clearScreen: false, logLevel: 'warn' })
await server.listen(port)
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } })
  await page.goto(`http://localhost:${port}/print?print=clicks`, { waitUntil: 'networkidle', timeout: 120_000 })
  // Still images: with reduced motion every visualization draws its state at once instead of animating into it.
  await page.emulateMedia({ colorScheme: 'light', media: 'screen', reducedMotion: 'reduce' })
  await page.locator('.slidev-slide-loading').first().waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {})
  for (const el of await page.locator('[data-waitfor]').all()) {
    const sel = await el.getAttribute('data-waitfor')
    if (sel) await el.locator(sel).waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {})
  }
  await page.waitForTimeout(500)

  // Every page on the print page has an id `SSS-CC`: slide number, then the
  // click state counted from 1 (`003-01` is slide 3 before any click). Decide which stay.
  const pageId = (no: number, clicks: number) => `${String(no).padStart(3, '0')}-${String(clicks + 1).padStart(2, '0')}`
  const ids: string[] = await page.locator('.print-slide-container').evaluateAll((els) => els.map((e) => e.id))
  const maxClicks = new Map<number, number>()
  for (const id of ids) {
    const m = /^(\d+)-(\d+)$/.exec(id)
    if (!m) throw new Error(`unexpected print page id ${JSON.stringify(id)}; Slidev's print layout has changed`)
    const [no, clicks] = [Number(m[1]), Number(m[2]) - 1]
    maxClicks.set(no, Math.max(maxClicks.get(no) ?? 0, clicks))
  }
  const order: string[] = []
  for (const [no, wanted] of plan) {
    if (wanted === null) continue
    const max = maxClicks.get(no)
    if (max === undefined) throw new Error(`slide ${no} did not render`)
    if (wanted.length === 0) {
      order.push(pageId(no, max))
      continue
    }
    const missing = wanted.filter((c) => c > max)
    if (missing.length) throw new Error(`slide ${no} has clicks 0-${max}; exportClicks asks for ${missing.join(', ')}`)
    for (const c of wanted) order.push(pageId(no, c))
    console.error(`slide ${no}: clicks ${wanted.join(', ')} of 0-${max}`)
  }
  const keep = new Set(order)
  await page.evaluate(
    ({ keep, order }) => {
      for (const el of document.querySelectorAll<HTMLElement>('.print-slide-container')) if (!keep.includes(el.id)) el.style.display = 'none'
      const parent = document.querySelector('.print-slide-container')?.parentElement
      if (parent) for (const id of order) parent.appendChild(document.getElementById(id)!)
      // The last page would otherwise be followed by a forced break, and so by a blank page.
      const last = document.getElementById(order[order.length - 1])
      if (last) last.style.breakAfter = last.style.pageBreakAfter = 'auto'
      for (const el of document.querySelectorAll<HTMLElement>('.monaco-aria-container, #twoslash-container')) el.style.display = 'none'
    },
    { keep: [...keep], order },
  )
  await page.setViewportSize({ width: WIDTH, height: HEIGHT * order.length })
  await page.waitForTimeout(300)

  const pdf = await page.pdf({ width: WIDTH, height: HEIGHT, margin: { left: 0, top: 0, right: 0, bottom: 0 }, printBackground: true, preferCSSPageSize: true })

  const doc = await PDFDocument.load(pdf)
  if (doc.getPageCount() !== order.length) throw new Error(`expected ${order.length} pages, got ${doc.getPageCount()}`)
  const config = options.data.config as { title?: string; author?: string; info?: string }
  doc.setTitle(config.title ?? 'The Agentic Software Engineer')
  doc.setAuthor(config.author ?? 'CS50')
  if (config.info) doc.setSubject(config.info.trim())
  doc.setCreator('slidev + scripts/export.ts')
  writeFileSync(output, await doc.save())
  console.error(`✓ ${order.length} pages → ${output}`)
} finally {
  await browser.close()
  await server.close()
}
