<script setup lang="ts">
/**
 * LanguageIndex — the hook before "An Inversion".
 *
 * Starts as the serious chart: TIOBE ratings for seven languages, each November
 * 2021–2026 (source: www.tiobe.com, read from the per-language pages). Then a
 * second index slides in, the Prompt Index from prompt_index.md (satirical).
 * Then one more line is drawn on the chart: English, the language all of those
 * prompts are written in, which no index tracks.
 */
import { computed, ref } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import promptIndexMd from '../../prompt_index.md?raw'

// ---------------------------------------------------------------- TIOBE data

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026]

interface Lang {
  name: string
  /** Rating (%) each November, 2021 → 2026. */
  ratings: number[]
  cs50?: boolean
  shade: string
}

/**
 * TIOBE index ratings, November of each year. Retrieved from www.tiobe.com, November 2026.
 * Colours are the Okabe–Ito palette, which stays distinguishable under the common
 * forms of colour blindness; crimson is kept for the one line that is not TIOBE's.
 */
const langs: Lang[] = [
  { name: 'Python', ratings: [11.77, 17.18, 14.16, 22.85, 23.37, 20.86], cs50: true, shade: '#0072b2' },
  { name: 'C', ratings: [10.72, 15.08, 11.77, 9.01, 9.68, 11.48], cs50: true, shade: '#009e73' },
  { name: 'Java', ratings: [10.72, 11.98, 8.35, 9.6, 8.54, 8.89], shade: '#e69f00' },
  { name: 'C++', ratings: [8.28, 10.75, 10.36, 10.64, 8.95, 8.35], shade: '#56b4e9' },
  { name: 'C#', ratings: [6.06, 4.25, 7.65, 4.98, 7.65, 3.39], shade: '#cc79a7' },
  { name: 'JavaScript', ratings: [2.66, 2.74, 3.21, 3.71, 3.42, 2.42], cs50: true, shade: '#8a6d00' },
  { name: 'SQL', ratings: [2.11, 1.82, 1.88, 1.94, 1.8, 1.91], cs50: true, shade: '#495057' },
]

/**
 * Not a TIOBE series. Prompts to AI in English, as a share of "programming"
 * done, drawn to the same axis to make one point: the fastest-growing
 * language of the last five years is the one the room already speaks.
 * Illustrative; ChatGPT appeared on 30 November 2022.
 */
const english: Lang = { name: 'English', ratings: [0.3, 1.2, 9, 17, 24, 29], shade: '#a51c30' }

// ------------------------------------------------------------- Prompt Index

interface Prompt {
  rank: number
  text: string
  rating: string
  change: string
  cs50: string | null
}

/** Parse the table in prompt_index.md so the slide and the file cannot drift apart. */
const prompts: Prompt[] = promptIndexMd
  .split('\n')
  .map((line) => line.split('|').map((c) => c.trim()))
  .filter((cells) => cells.length >= 6 && /^\d+$/.test(cells[1]))
  .map((cells) => {
    const changeRaw = cells[4]
    const note = changeRaw.match(/\*\((.*?)\)\*/)
    return {
      rank: Number(cells[1]),
      text: cells[2].replace(/^\*|\*$/g, ''),
      rating: cells[3],
      change: changeRaw.replace(/\*\(.*?\)\*/, '').trim(),
      cs50: note ? note[1] : null,
    }
  })

// ------------------------------------------------------------------- steps
//  0  the TIOBE chart
//  1  the Prompt Index, ranks 1–8
//  2  ranks 9–15, CS50 entries marked
//  3  English is drawn on the chart
//  4  the line
const { step, at } = useVizSteps(4)

const hovered = ref<string | null>(null)

// ------------------------------------------------------------------- chart

const W = 800
const H = 330
const PAD = { l: 40, r: 110, t: 16, b: 30 }
const Y_MAX = 30

const x = (i: number) => PAD.l + (i / (YEARS.length - 1)) * (W - PAD.l - PAD.r)
const y = (v: number) => PAD.t + (1 - v / Y_MAX) * (H - PAD.t - PAD.b)

function path(l: Lang) {
  return l.ratings.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
}

/** End-of-line labels, nudged apart so neighbours stay readable. */
const labels = computed(() => {
  const all = [...langs, ...(at(3) ? [english] : [])]
  const items = all
    .map((l) => ({ l, y: y(l.ratings[l.ratings.length - 1]) }))
    .sort((a, b) => a.y - b.y)
  const MIN = 13
  for (let i = 1; i < items.length; i++) {
    if (items[i].y - items[i - 1].y < MIN) items[i].y = items[i - 1].y + MIN
  }
  return items
})

const gridlines = [0, 5, 10, 15, 20, 25, 30]

/** Legend entries, in rank order; English joins once it is drawn. */
const legend = computed(() => (at(3) ? [...langs, english] : langs))
</script>

<template>
  <div class="viz lang-index" :class="{ twist: at(3) }">
    <div class="head">
      <div class="kicker">
        <template v-if="!at(3)">TIOBE Index · ratings each November, 2021–2026 · <a href="https://www.tiobe.com" target="_blank" rel="noopener">www.tiobe.com</a></template>
        <template v-else>The fastest-growing programming language of the last five years isn't on the list.</template>
      </div>
      <div v-if="at(4)" class="line viz-enter shown">It's the one you're already familiar with.</div>
    </div>

    <div class="legend" role="list" aria-label="Languages" @mouseleave="hovered = null">
      <button
        v-for="l in legend"
        :key="l.name"
        type="button"
        role="listitem"
        class="key"
        :class="{ dim: hovered && hovered !== l.name, english: l === english }"
        @mouseenter="hovered = l.name"
        @focus="hovered = l.name"
        @blur="hovered = null"
      >
        <span class="swatch" :style="{ background: l.shade }" />{{ l.name }}<span v-if="l.cs50" class="key-tag">CS50</span>
      </button>
    </div>

    <div class="body">
      <svg class="chart" :viewBox="`0 0 ${W} ${H}`" @mouseleave="hovered = null">
        <!-- grid -->
        <g class="axes">
          <template v-for="g in gridlines" :key="g">
            <line :x1="PAD.l" :x2="W - PAD.r" :y1="y(g)" :y2="y(g)" />
            <text :x="PAD.l - 6" :y="y(g) + 3">{{ g }}%</text>
          </template>
          <text v-for="(yr, i) in YEARS" :key="yr" class="year" :x="x(i)" :y="H - 8">{{ yr }}</text>
        </g>

        <!-- TIOBE lines -->
        <g v-for="l in langs" :key="l.name" class="series" :class="{ dim: hovered && hovered !== l.name, lit: hovered === l.name, cs50: l.cs50 }" @mouseenter="hovered = l.name">
          <path :d="path(l)" :stroke="l.shade" class="hit" />
          <path :d="path(l)" :stroke="l.shade" />
          <circle v-for="(v, i) in l.ratings" :key="i" :cx="x(i)" :cy="y(v)" r="2.6" :fill="l.shade" />
        </g>

        <!-- English -->
        <g v-if="at(3)" class="series english" :class="{ dim: hovered && hovered !== 'English' }" @mouseenter="hovered = 'English'">
          <path :d="path(english)" :stroke="english.shade" class="hit" />
          <path :d="path(english)" :stroke="english.shade" class="draw" pathLength="1" />
          <circle v-for="(v, i) in english.ratings" :key="i" :cx="x(i)" :cy="y(v)" r="3" :fill="english.shade" :style="{ animationDelay: `${300 + i * 180}ms` }" class="pop" />
          <text :x="x(1) + 8" :y="y(0) - 5" class="note">ChatGPT, 30 Nov 2022</text>
        </g>

        <!-- end labels -->
        <g class="labels">
          <text
            v-for="{ l, y: ly } in labels"
            :key="l.name"
            :x="W - PAD.r + 8"
            :y="ly + 3.5"
            :fill="l.shade"
            :class="{ dim: hovered && hovered !== l.name, english: l === english }"
            @mouseenter="hovered = l.name"
          >
            {{ l.name }}<tspan v-if="l.cs50" class="tag"> · CS50</tspan><tspan v-if="l === english" class="tag">*</tspan>
          </text>
        </g>
      </svg>

      <!-- the second index -->
      <transition name="slidein">
        <div v-if="at(1) && !at(3)" class="index">
          <div class="index-title">The Prompt Index <span>November 2026</span></div>
          <table>
            <thead>
              <tr><th>#</th><th>Prompt</th><th class="r">Ratings</th><th>Change</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in prompts" :key="p.rank" class="viz-enter" :class="{ shown: p.rank <= 8 ? at(1) : at(2), cs50: p.cs50 && at(2) }">
                <td>{{ p.rank }}</td>
                <td class="prompt">{{ p.text }}<span v-if="p.cs50 && at(2)" class="cs50-tag">CS50</span></td>
                <td class="r">{{ p.rating }}</td>
                <td class="chg" :class="{ up: p.change.startsWith('▲'), new: p.change === 'New' }">{{ p.change }}</td>
              </tr>
            </tbody>
          </table>
          <div class="fine">Satirical. The ratings are made up; the prompts are not.</div>
        </div>
      </transition>

      <div v-if="at(3)" class="footnote viz-enter shown">* Not tracked by TIOBE. Every prompt on the other index was written in it.</div>
    </div>
  </div>
</template>

<style scoped>
.lang-index {
  grid-template-rows: auto auto 1fr;
  gap: 0.35rem;
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  min-height: 1.6rem;
}
.kicker {
  font-size: 0.78rem;
  color: var(--cs50-muted);
  transition: color 300ms;
}
.twist .kicker {
  color: var(--cs50-body);
  font-weight: 700;
  font-size: 0.95rem;
}
.kicker a {
  color: inherit;
  text-decoration: underline;
}
.line {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cs50-crimson);
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
}
.key {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.12rem 0.55rem 0.12rem 0.4rem;
  border: 1px solid var(--cs50-border);
  border-radius: 999px;
  background: #fff;
  color: var(--cs50-body);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: default;
  transition: opacity 200ms, border-color 200ms;
}
.key:focus-visible {
  outline: 2px solid var(--cs50-body);
  outline-offset: 2px;
}
.key.dim {
  opacity: 0.35;
}
.key.english {
  color: var(--cs50-crimson);
  border-color: var(--cs50-crimson);
  animation: rise 300ms ease both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}
.swatch {
  width: 0.9rem;
  height: 0.3rem;
  border-radius: 2px;
}
.key-tag {
  font-weight: 400;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  color: var(--cs50-muted);
}
.body {
  position: relative;
  min-height: 0;
  display: grid;
}
.chart {
  width: 100%;
  height: 100%;
  max-height: 100%;
  font-family: inherit;
}
.axes line {
  stroke: var(--cs50-border);
  stroke-width: 1;
}
.axes text {
  font-size: 9px;
  fill: var(--cs50-muted);
  text-anchor: end;
}
.axes text.year {
  text-anchor: middle;
  font-size: 10px;
}
.series path {
  fill: none;
  stroke-width: 2.2;
  stroke-linejoin: round;
  stroke-linecap: round;
  transition: opacity 200ms, stroke-width 200ms;
}
.series path.hit {
  stroke-width: 12;
  opacity: 0;
}
.series.cs50 path:not(.hit) {
  stroke-width: 2.4;
}
.series.lit path:not(.hit) {
  stroke-width: 3.2;
}
.series.dim {
  opacity: 0.18;
}
.series circle {
  transition: opacity 200ms;
}
.series.english path:not(.hit) {
  stroke-width: 3;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw 1200ms cubic-bezier(0.4, 0, 0.2, 1) 150ms forwards;
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
.series.english circle.pop {
  opacity: 0;
  animation: pop 250ms ease-out forwards;
}
@keyframes pop {
  from {
    opacity: 0;
    r: 0;
  }
  to {
    opacity: 1;
    r: 3;
  }
}
.series.english text.note {
  font-size: 9px;
  fill: var(--cs50-crimson);
  opacity: 0;
  animation: fade 400ms ease 500ms forwards;
}
@keyframes fade {
  to {
    opacity: 1;
  }
}
.labels text {
  font-size: 10.5px;
  font-weight: 700;
  transition: opacity 200ms;
}
.labels text.dim {
  opacity: 0.25;
}
.labels text.english {
  font-size: 12px;
}
.labels .tag {
  font-weight: 400;
  fill: var(--cs50-muted);
  font-size: 9px;
}
.labels text.english .tag {
  fill: var(--cs50-crimson);
  font-size: 12px;
}

/* the second index: a panel over the right of the chart */
.index {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 62%;
  background: #fff;
  border: 1px solid var(--cs50-border);
  border-left: 4px solid var(--cs50-crimson);
  border-radius: 6px;
  box-shadow: -12px 0 32px rgba(33, 37, 41, 0.12);
  padding: 0.5rem 0.8rem 0.4rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.index-title {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}
.index-title span {
  font-weight: 400;
  color: var(--cs50-muted);
  font-size: 0.78rem;
  margin-left: 0.4rem;
}
.index table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
  line-height: 1.3;
}
.index th {
  text-align: left;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cs50-muted);
  padding: 0.1rem 0.35rem;
  border-bottom: 2px solid var(--cs50-body);
}
.index td {
  padding: 0.16rem 0.4rem;
  border-bottom: 1px solid var(--cs50-border);
  white-space: nowrap;
}
.index .r {
  text-align: right;
}
.index td.prompt {
  font-weight: 700;
  white-space: normal;
}
.index tr.cs50 td {
  background: rgba(165, 28, 48, 0.06);
}
.cs50-tag {
  display: inline-block;
  margin-left: 0.4rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--cs50-crimson);
  color: #fff;
  font-size: 0.52rem;
  letter-spacing: 0.08em;
  vertical-align: middle;
}
.chg.up {
  color: #198754;
}
.chg.new {
  color: var(--cs50-crimson);
  font-weight: 700;
}
.fine {
  margin-top: auto;
  padding-top: 0.25rem;
  font-size: 0.6rem;
  color: var(--cs50-muted);
}
.slidein-enter-active,
.slidein-leave-active {
  transition: transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 300ms;
}
.slidein-enter-from,
.slidein-leave-to {
  transform: translateX(40px);
  opacity: 0;
}
.footnote {
  position: absolute;
  left: 2.6rem;
  bottom: 0;
  font-size: 0.7rem;
  color: var(--cs50-crimson);
}
</style>
