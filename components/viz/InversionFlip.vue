<script setup lang="ts">
/**
 * InversionFlip — the opening hook as a picture.
 * Step 1: this semester (spec → you → code → check50).
 * Step 2: from here on (you → spec → agent → code → you verify).
 * Step 3: highlight where "you" moved to.
 */
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

const { at, is } = useVizSteps(3)

const before = [
  { label: 'Specification', tip: 'Handed to you: "render an apology if shares is not a positive integer".', you: false },
  { label: 'You', tip: 'Translate English into C, Python and SQL. The human compiler.', you: true },
  { label: 'Code', tip: 'app.py, finance.db, the templates.', you: false },
  { label: 'check50', tip: 'Someone else wrote the tests.', you: false },
]

const after = [
  { label: 'You', tip: 'Decide what to build.', you: true, role: 'decide' },
  { label: 'Specification', tip: 'You write down what correct means.', you: true, role: 'specify' },
  { label: 'Agent', tip: 'Turns the spec into code, runs it, iterates.', you: false },
  { label: 'Code', tip: 'Still app.py. You may not read all of it.', you: false },
  { label: 'You', tip: 'Judge the evidence that it works.', you: true, role: 'verify' },
]
</script>

<template>
  <div class="viz flip">
    <section class="row viz-enter" :class="{ shown: at(1) }">
      <div class="viz-label">This semester</div>
      <div class="chain">
        <template v-for="(n, i) in before" :key="n.label + i">
          <Tip :text="n.tip" side="bottom">
            <div class="node" :class="{ you: n.you, hot: n.you && is(1) }">{{ n.label }}</div>
          </Tip>
          <span v-if="i < before.length - 1" class="arrow">→</span>
        </template>
      </div>
      <div class="note" :class="{ dimmed: at(2) }">Your job was the arrow in the middle: translation.</div>
    </section>

    <section class="row viz-enter" :class="{ shown: at(2) }">
      <div class="viz-label accent">From here on</div>
      <div class="chain">
        <template v-for="(n, i) in after" :key="n.label + i">
          <Tip :text="n.tip" side="bottom">
            <div class="node" :class="{ you: n.you, hot: n.you && at(3), agent: n.label === 'Agent' }">
              {{ n.label }}
              <span v-if="n.role && at(3)" class="role">{{ n.role }}</span>
            </div>
          </Tip>
          <span v-if="i < after.length - 1" class="arrow">→</span>
        </template>
      </div>
      <div class="note viz-enter" :class="{ shown: at(3) }">
        You appear <b>three times</b>, and none of them is "type the code".
      </div>
    </section>
  </div>
</template>

<style scoped>
.flip {
  grid-template-rows: 1fr 1fr;
  align-content: center;
}
.row {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.chain {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: nowrap;
}
.node {
  padding: 0.7rem 1.1rem;
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  background: #fff;
  font-size: 1rem;
  font-weight: 700;
  color: var(--cs50-body);
  position: relative;
  transition: all 300ms;
  min-width: 7rem;
  text-align: center;
}
.node.you {
  border-style: dashed;
}
.node.agent {
  background: var(--cs50-code-bg);
}
.node.hot {
  background: var(--cs50-crimson);
  border-color: var(--cs50-crimson);
  color: #fff;
}
.role {
  position: absolute;
  left: 50%;
  bottom: -1.3rem;
  transform: translateX(-50%);
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cs50-crimson);
  font-weight: 700;
}
.arrow {
  color: var(--cs50-muted);
  font-size: 1.4rem;
}
.note {
  margin-top: 1.4rem;
  text-align: center;
  color: var(--cs50-muted);
  font-size: 0.95rem;
  transition: opacity 300ms;
}
.note.dimmed {
  opacity: 0.5;
}
.note b {
  color: var(--cs50-crimson);
}
</style>
