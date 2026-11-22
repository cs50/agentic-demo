<script setup lang="ts">
/**
 * EffortChart — the synthesis table as a picture. For each era, where a
 * person's time goes, as a stacked bar. Every segment carries its own label,
 * so the chart reads without relying on colour; the legend repeats the
 * grouping (human-compiler work vs. engineering work) in words.
 */
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

interface Category {
  id: string
  label: string
  short: string
  tip: string
  shade: string
  /** Light text on dark shades, dark text on light ones. */
  ink: string
  group: 'compiler' | 'engineering'
}

const categories: Category[] = [
  { id: 'write', label: 'Writing code', short: 'Writing', tip: 'Typing the implementation yourself.', shade: '#ced4da', ink: '#212529', group: 'compiler' },
  { id: 'patch', label: 'Reading & patching', short: 'Patching', tip: 'Reading what the model wrote, running it, fixing it by hand.', shade: '#868e96', ink: '#fff', group: 'compiler' },
  { id: 'steer', label: 'Steering', short: 'Steering', tip: 'Supplying context, choosing the next step, reviewing diffs.', shade: '#495057', ink: '#fff', group: 'compiler' },
  { id: 'spec', label: 'Specifying', short: 'Specifying', tip: 'Writing down what correct means.', shade: '#a51c30', ink: '#fff', group: 'engineering' },
  { id: 'guard', label: 'Guardrails', short: 'Guardrails', tip: 'Setting up the checks that cannot be talked out of it.', shade: '#c9566a', ink: '#fff', group: 'engineering' },
  { id: 'verify', label: 'Judging evidence', short: 'Judging', tip: 'Reading test output, screenshots, diffs: the proof, not the code.', shade: '#efb3bd', ink: '#58151c', group: 'engineering' },
]

type Shares = Record<string, number>

/** Share of a person's effort, per era. Illustrative, sums to 100. */
const eras: { name: string; sub: string; shares: Shares }[] = [
  { name: 'Problem set', sub: 'this semester', shares: { write: 70, patch: 15, steer: 0, spec: 0, guard: 5, verify: 10 } },
  { name: 'Chatbot', sub: 'text in, text out', shares: { write: 20, patch: 55, steer: 10, spec: 5, guard: 0, verify: 10 } },
  { name: 'Agent', sub: 'editor and terminal', shares: { write: 5, patch: 15, steer: 40, spec: 15, guard: 10, verify: 15 } },
  { name: 'Factory', sub: 'issues and pull requests', shares: { write: 0, patch: 0, steer: 10, spec: 35, guard: 20, verify: 35 } },
]

const { at } = useVizSteps(eras.length)

/** Enough room for a word? Otherwise show just the number; below that, nothing (tooltip still works). */
function labelFor(c: Category, pct: number) {
  if (pct >= 14) return `${c.short} ${pct}%`
  if (pct >= 5) return `${pct}%`
  return ''
}

function total(e: { shares: Shares }, group: Category['group']) {
  return categories.filter((c) => c.group === group).reduce((n, c) => n + (e.shares[c.id] ?? 0), 0)
}
</script>

<template>
  <div class="viz effort">
    <section class="viz-card chart">
      <div class="head">
        <span class="viz-label">Where a person's effort goes</span>
        <span class="groups">
          <span class="group"><span class="swatch compiler" />Translating, by hand or by patching</span>
          <span class="group"><span class="swatch engineering" />Engineering: specify, guard, judge</span>
        </span>
      </div>

      <div class="bars">
        <div v-for="(e, i) in eras" :key="e.name" class="era viz-enter" :class="{ shown: at(i + 1) }">
          <div class="era-name">
            <b>{{ e.name }}</b>
            <span>{{ e.sub }}</span>
          </div>
          <div class="bar" role="img" :aria-label="`${e.name}: ${categories.map((c) => `${c.label} ${e.shares[c.id]}%`).join(', ')}`">
            <Tip v-for="c in categories" :key="c.id" :text="`${c.label}: ${e.shares[c.id]}%. ${c.tip}`" side="bottom">
              <span
                class="seg"
                :class="[c.group, { empty: !e.shares[c.id] }]"
                :style="{ width: `${e.shares[c.id]}%`, background: c.shade, color: c.ink }"
              >
                <span class="seg-label">{{ labelFor(c, e.shares[c.id]) }}</span>
              </span>
            </Tip>
          </div>
          <div class="totals">
            <span class="t compiler">{{ total(e, 'compiler') }}%</span>
            <span class="t engineering">{{ total(e, 'engineering') }}%</span>
          </div>
        </div>
      </div>

      <div class="legend">
        <span v-for="c in categories" :key="c.id" class="key">
          <span class="swatch" :style="{ background: c.shade }" />{{ c.label }}
        </span>
      </div>

      <div class="verdict viz-enter" :class="{ shown: at(eras.length) }">
        Left to right, translating falls from 85% to 10%; specifying, guarding and judging rise from 15% to 90%.
        <b>The rising part is what this course taught you to do.</b>
      </div>
    </section>
  </div>
</template>

<style scoped>
.effort {
  grid-template-columns: 1fr;
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.groups {
  display: flex;
  gap: 1.2rem;
  font-size: 0.74rem;
  color: var(--cs50-muted);
}
.group {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.swatch {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 3px;
  flex: none;
}
.swatch.compiler {
  background: linear-gradient(90deg, #ced4da, #495057);
}
.swatch.engineering {
  background: linear-gradient(90deg, #a51c30, #efb3bd);
}
.bars {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  flex: 1;
  justify-content: center;
}
.era {
  display: grid;
  grid-template-columns: 8.5rem 1fr 6.5rem;
  gap: 0.8rem;
  align-items: center;
}
.era-name {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.era-name b {
  font-size: 1rem;
}
.era-name span {
  font-size: 0.72rem;
  color: var(--cs50-muted);
}
.bar {
  display: flex;
  height: 2.5rem;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--cs50-border);
  background: #fff;
}
.bar :deep(.tip) {
  display: contents;
}
.seg {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.7);
  transition: width 600ms ease;
}
.seg.empty {
  border-right: 0;
}
.seg-label {
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  padding: 0 0.2rem;
}
.seg-label:empty {
  display: none;
}
.era:not(.shown) .seg {
  width: 0 !important;
}
.totals {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.t.compiler {
  color: #495057;
}
.t.engineering {
  color: var(--cs50-crimson);
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-top: 0.6rem;
  font-size: 0.72rem;
  color: var(--cs50-muted);
}
.key {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.verdict {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.9rem;
  line-height: 1.45;
}
.verdict b {
  color: var(--cs50-crimson);
}
</style>
