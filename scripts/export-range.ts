/**
 * export-range.ts — which slides go into the PDF.
 *
 * A slide with `export: false` in its frontmatter is left out: the join slides,
 * whose QR code and headcount mean nothing on paper. Prints the remaining slide
 * numbers as a range string Slidev's `--range` accepts (`1,3-54,56-58`), so the
 * export script is `slidev export --range "$(node --experimental-strip-types
 * scripts/export-range.ts)"`.
 *
 * Slide numbers are the deck's own (what the overview shows), from Slidev's
 * parser, so the output cannot drift from how Slidev counts.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseSync } from '@slidev/parser'

const file = resolve(import.meta.dirname, '../slides.md')
const { slides } = parseSync(readFileSync(file, 'utf8'), file)

const kept = slides.map((s, i) => (s.frontmatter.export === false ? null : i + 1)).filter((n): n is number => n !== null)

/** `[1,2,3,5,7,8]` → `1-3,5,7-8` */
function ranges(nums: number[]): string {
  const out: string[] = []
  for (let i = 0; i < nums.length; ) {
    let j = i
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++
    out.push(i === j ? String(nums[i]) : `${nums[i]}-${nums[j]}`)
    i = j + 1
  }
  return out.join(',')
}

if (process.argv.includes('--list')) {
  const skipped = slides.map((s, i) => (s.frontmatter.export === false ? `${i + 1} (${s.title ?? s.frontmatter.title ?? 'untitled'})` : null)).filter(Boolean)
  console.error(`${kept.length} of ${slides.length} slides; left out: ${skipped.join(', ') || 'none'}`)
}
console.log(ranges(kept))
