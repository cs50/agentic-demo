<script setup lang="ts">
/**
 * InversionFlip — the opening hook as a picture.
 * Step 1: this semester (spec → you → code → check50).
 * Step 2: from here on (you → spec → agent → code → you).
 * Step 3: the three places "you" now stand light up.
 */
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

const { at } = useVizSteps(3)

interface Node {
  label: string
  /** One line under the label: what this box does. */
  sub: string
  tip: string
  you?: boolean
  agent?: boolean
}

const before: Node[] = [
  { label: 'Specification', sub: 'handed to you', tip: 'The problem set: "render an apology if shares is not a positive integer".' },
  { label: 'You', sub: 'translate it into code', tip: 'English in and code out. You were the compiler.', you: true },
  { label: 'Code', sub: 'app.py, finance.db', tip: 'Every line typed by you.' },
  { label: 'check50', sub: 'someone else\u2019s tests', tip: 'You did not write the tests; the staff did.' },
]

const after: Node[] = [
  { label: 'You', sub: 'decide what to build', tip: 'The feature, the scope, the trade-offs.', you: true },
  { label: 'Specification', sub: 'you write it', tip: 'What correct means: inputs, outputs, and what must always hold.', you: true },
  { label: 'Agent', sub: 'writes, runs and tries again', tip: 'Turns the spec into code, runs it, reads the errors, tries again.', agent: true },
  { label: 'Code', sub: 'app.py, finance.db', tip: 'Still the same files. You may not read every line.' },
  { label: 'You', sub: 'judge the evidence', tip: 'Tests, screenshots and diffs. Does the proof convince you?', you: true },
]
</script>

<template>
  <div class="viz flip">
    <section class="row" :class="{ shown: at(1), faded: at(3) }">
      <div class="row-label">
        <span class="kicker">This semester</span>
        <span class="when">Problem sets 1 to 9</span>
      </div>
      <div class="chain">
        <template v-for="(n, i) in before" :key="n.label + i">
          <Tip :text="n.tip" side="bottom">
            <div class="node" :class="{ you: n.you }">
              <span class="label">{{ n.label }}</span>
              <span class="sub">{{ n.sub }}</span>
            </div>
          </Tip>
          <span v-if="i < before.length - 1" class="arrow" aria-hidden="true">→</span>
        </template>
      </div>
    </section>

    <div class="divider" :class="{ shown: at(2) }">
      <span class="line" />
      <span class="pill">the same job, flipped</span>
      <span class="line" />
    </div>

    <section class="row" :class="{ shown: at(2) }">
      <div class="row-label">
        <span class="kicker accent">From here on</span>
        <span class="when">Your final project, and after</span>
      </div>
      <div class="chain">
        <template v-for="(n, i) in after" :key="n.label + i">
          <Tip :text="n.tip" side="top">
            <div class="node" :class="{ you: n.you, agent: n.agent, hot: n.you && at(3), dim: !n.you && at(3) }">
              <span class="label">{{ n.label }}</span>
              <span class="sub">{{ n.sub }}</span>
            </div>
          </Tip>
          <span v-if="i < after.length - 1" class="arrow" aria-hidden="true">→</span>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.flip {
  grid-template-rows: 1fr auto 1fr;
  gap: 0.6rem;
  align-items: center;
}
.row {
  display: grid;
  grid-template-columns: 9.5rem 1fr;
  align-items: center;
  gap: 1rem;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 350ms ease, transform 350ms ease;
}
.row.shown {
  opacity: 1;
  transform: none;
}
.row.faded {
  opacity: 0.55;
}
.row-label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border-right: 3px solid var(--cs50-border);
  padding-right: 0.9rem;
}
.kicker {
  font-size: 0.84rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--cs50-muted);
}
.kicker.accent {
  color: var(--cs50-crimson);
}
.when {
  font-size: 0.86rem;
  color: var(--cs50-muted);
}
.chain {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 0.35rem;
  min-width: 0;
}
.chain :deep(.tip) {
  flex: 1 1 auto; /* size to the longest word, then share the rest */
  display: flex;
}
.node {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  padding: 1rem 0.7rem;
  min-height: 6.4rem;
  border: 1px solid var(--cs50-border);
  border-radius: 10px;
  background: #fff;
  text-align: center;
  transition: all 300ms;
}
.node .label {
  font-size: 1.2rem;
  white-space: nowrap;
  font-weight: 700;
  color: var(--cs50-body);
  line-height: 1.15;
}
.node .sub {
  font-size: 0.82rem;
  color: var(--cs50-muted);
  line-height: 1.3;
}
.node.you {
  border-style: dashed;
  border-color: #adb5bd;
}
.node.agent {
  background: var(--cs50-code-bg);
}
.node.hot {
  background: var(--cs50-crimson);
  border-color: var(--cs50-crimson);
  border-style: solid;
  box-shadow: 0 0 0 4px rgba(165, 28, 48, 0.15);
}
.node.hot .label,
.node.hot .sub {
  color: #fff;
}
.node.dim {
  opacity: 0.5;
}
.arrow {
  align-self: center;
  flex: none;
  width: 1.6rem;
  text-align: center;
  color: var(--cs50-muted);
  font-size: 1.4rem;
  line-height: 1;
}
.divider {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0 0 0 10.5rem;
  opacity: 0;
  transition: opacity 350ms ease;
}
.divider.shown {
  opacity: 1;
}
.divider .line {
  flex: 1;
  height: 1px;
  background: var(--cs50-border);
}
.pill {
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--cs50-crimson);
  white-space: nowrap;
}
</style>
