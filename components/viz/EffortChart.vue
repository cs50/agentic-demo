<script setup lang="ts">
/**
 * EffortChart — the synthesis table as a picture. For each era, where a
 * person's time goes, as a stacked bar. Every segment carries its own label,
 * so the chart reads without relying on colour; the legend repeats the
 * grouping (human-compiler work vs. engineering work) in words.
 */
import { ref } from 'vue'
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
  { id: 'verify', label: 'Judging evidence', short: 'Judging', tip: 'Reading test output, screenshots and diffs. The proof rather than the code.', shade: '#efb3bd', ink: '#58151c', group: 'engineering' },
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

/** Category under the pointer (or keyboard focus): lights up its legend entry and its segment in every bar. */
const hovered = ref<string | null>(null)

/** Enough room for a word? Otherwise show just the number; below that, nothing (tooltip still works). */
function labelFor(c: Category, pct: number) {
  // Bars are ~600px wide: 20% is ~120px, enough for a short word and a number at 0.66rem.
  if (pct >= 20) return `${c.short} ${pct}%`
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
        <span class="totals-head"><span>translating</span><span>engineering</span></span>
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
                :class="[c.group, { empty: !e.shares[c.id], lit: hovered === c.id, dim: hovered && hovered !== c.id }]"
                :style="{ width: `${e.shares[c.id]}%`, background: c.shade, color: c.ink }"
                @mouseenter="hovered = c.id"
                @mouseleave="hovered = null"
                @focusin="hovered = c.id"
                @focusout="hovered = null"
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
        <span
          v-for="c in categories"
          :key="c.id"
          class="key"
          :class="[c.group, { lit: hovered === c.id, dim: hovered && hovered !== c.id }]"
          @mouseenter="hovered = c.id"
          @mouseleave="hovered = null"
        >
          <span class="swatch" :style="{ background: c.shade }" />{{ c.label }}
        </span>
      </div>

      <div class="verdict viz-enter" :class="{ shown: at(eras.length) }">
        From left to right, translating falls from 85% to 10% while specifying, guarding and judging rise from 15% to 90%.
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
.swatch {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 3px;
  flex: none;
}
.totals-head {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  width: 9.5rem;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cs50-muted);
  font-weight: 700;
}
.totals-head span:last-child {
  color: var(--cs50-crimson);
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
  grid-template-columns: 8.5rem 1fr 9.5rem;
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
.seg.lit {
  outline: 2px solid var(--cs50-body);
  outline-offset: -2px;
  z-index: 1;
}
.seg.dim {
  opacity: 0.35;
}
.seg-label {
  display: inline-block;
  box-sizing: border-box;
  font-size: 0.66rem;
  font-weight: 700;
  white-space: nowrap;
  padding: 0 0.2rem;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
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
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: default;
  transition: all 150ms;
}
.key.lit {
  color: var(--cs50-body);
  font-weight: 700;
  border-color: var(--cs50-body);
  background: #fff;
}
.key.dim {
  opacity: 0.45;
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
