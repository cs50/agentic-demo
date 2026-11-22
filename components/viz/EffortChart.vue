<script setup lang="ts">
/**
 * EffortChart — the synthesis table as a picture. For each era, where a
 * person's time goes, as a stacked bar. The categories are the lecture's own:
 * the human-compiler work shrinks, the engineering work grows.
 */
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

const categories = [
  { id: 'write', label: 'Writing code', tip: 'Typing the implementation yourself.', shade: '#adb5bd' },
  { id: 'patch', label: 'Reading & patching', tip: 'Reading what the model wrote, running it, fixing it by hand.', shade: '#6c757d' },
  { id: 'steer', label: 'Steering', tip: 'Supplying context, choosing the next step, reviewing diffs.', shade: '#495057' },
  { id: 'spec', label: 'Specifying', tip: 'Writing down what correct means.', shade: '#a51c30' },
  { id: 'guard', label: 'Guardrails', tip: 'Setting up the checks that cannot be talked out of it.', shade: '#c43d52' },
  { id: 'verify', label: 'Judging evidence', tip: 'Reading test output, screenshots, diffs: the proof, not the code.', shade: '#e07a8a' },
]

/** Share of a person's effort, per era. Illustrative, sums to 100. */
const eras = [
  { name: 'Problem set', sub: 'this semester', shares: { write: 70, patch: 15, steer: 0, spec: 0, guard: 5, verify: 10 } },
  { name: 'Chatbot', sub: 'text in, text out', shares: { write: 20, patch: 55, steer: 10, spec: 5, guard: 0, verify: 10 } },
  { name: 'Agent', sub: 'editor and terminal', shares: { write: 5, patch: 15, steer: 40, spec: 15, guard: 10, verify: 15 } },
  { name: 'Factory', sub: 'issues and pull requests', shares: { write: 0, patch: 0, steer: 10, spec: 35, guard: 20, verify: 35 } },
]

const { at } = useVizSteps(eras.length)
</script>

<template>
  <div class="viz effort">
    <section class="viz-card chart">
      <div class="viz-label">Where a person's effort goes</div>
      <div class="bars">
        <div v-for="(e, i) in eras" :key="e.name" class="era viz-enter" :class="{ shown: at(i + 1) }">
          <div class="era-name">
            <b>{{ e.name }}</b>
            <span>{{ e.sub }}</span>
          </div>
          <div class="bar">
            <Tip v-for="c in categories" :key="c.id" :text="`${c.label}: ${e.shares[c.id as keyof typeof e.shares]}%`" side="bottom">
              <span
                class="seg"
                :style="{ width: `${e.shares[c.id as keyof typeof e.shares]}%`, background: c.shade }"
                :class="{ empty: !e.shares[c.id as keyof typeof e.shares] }"
              />
            </Tip>
          </div>
        </div>
      </div>
      <div class="legend">
        <span v-for="c in categories" :key="c.id" class="key">
          <span class="swatch" :style="{ background: c.shade }" />{{ c.label }}
        </span>
      </div>
    </section>

    <section class="viz-card side">
      <div class="viz-label accent">Read the reds</div>
      <p>Gray is the work of a human compiler: typing, then reading and patching what a model typed.</p>
      <p>Red is engineering: saying what correct means, building the walls, judging the evidence.</p>
      <div class="verdict viz-enter" :class="{ shown: at(eras.length) }">
        Left to right, the gray drains and the red fills. <b>The red is what this course taught you to do.</b>
      </div>
    </section>
  </div>
</template>

<style scoped>
.effort {
  grid-template-columns: 1.7fr 1fr;
}
.bars {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  flex: 1;
  justify-content: center;
}
.era {
  display: grid;
  grid-template-columns: 8.5rem 1fr;
  gap: 0.8rem;
  align-items: center;
}
.era-name {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.era-name b {
  font-size: 0.95rem;
}
.era-name span {
  font-size: 0.7rem;
  color: var(--cs50-muted);
}
.bar {
  display: flex;
  height: 2.6rem;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--cs50-border);
  background: #fff;
}
.bar :deep(.tip) {
  display: contents;
}
.seg {
  display: block;
  height: 100%;
  transition: width 600ms ease;
  border-right: 1px solid rgba(255, 255, 255, 0.6);
}
.seg.empty {
  border-right: 0;
}
.era:not(.shown) .seg {
  width: 0 !important;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-top: 0.8rem;
  font-size: 0.72rem;
  color: var(--cs50-muted);
}
.key {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.swatch {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 3px;
}
.side p {
  margin: 0 0 0.7rem;
  font-size: 0.9rem;
  line-height: 1.45;
}
.verdict {
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.86rem;
}
.verdict b {
  color: var(--cs50-crimson);
}
</style>
