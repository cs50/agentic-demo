<script setup lang="ts">
/**
 * FactoryPipeline — Concept 9. An issue travels issue → sandbox → plan →
 * implement → test → PR, one stage per step. The footer shows that this very
 * deck was built the same way, from the repository's own issues and PRs.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import { hint } from './config'
import Tip from './Tip.vue'

interface Stage {
  id: string
  label: string
  tip: string
  /** What the stage produced, shown when reached. */
  artifact: string
}

const stages: Stage[] = [
  { id: 'issue', label: 'Issue', tip: 'Someone writes down what they want. Nobody is at a keyboard yet.', artifact: '#5 "Let users add cash to their account" (a personal touch from the spec)' },
  { id: 'sandbox', label: 'Sandbox', tip: 'A clean machine in the cloud with the repository checked out. Thrown away afterwards.', artifact: 'git clone · pip install -r requirements.txt · flask run' },
  { id: 'plan', label: 'Plan', tip: 'An agent reads the issue and the code and writes down the change before making it.', artifact: 'Add /deposit (GET form, POST amount). Positive number only. UPDATE users SET cash = cash + ?.' },
  { id: 'implement', label: 'Implement', tip: 'The change, in a branch.', artifact: 'app.py +22 · templates/deposit.html +18 · layout.html +1' },
  { id: 'test', label: 'Test', tip: 'The spec\u2019s test plan plus the new case, run on the sandbox.', artifact: 'deposit $500 → cash +500.00 ✓ · deposit -5 → apology ✓ · check50 12/12 ✓' },
  { id: 'pr', label: 'Pull request', tip: 'A summary of what changed and why, with the test results attached. This is where you come in.', artifact: 'PR #6 "Add cash deposits" · 3 files · ready for review' },
]

const { step, at } = useVizSteps(stages.length)
const reached = computed(() => step.value)

/** This repository, as of writing. A static snapshot: the lecture is offline. */
const thisDeck = [
  { kind: 'PR', n: 1, title: 'Prototype: live-edited slides and an embedded controller-driven game' },
  { kind: 'Issue', n: 2, title: 'Phase 2: build the lecture deck from the spec' },
  { kind: 'PR', n: 3, title: 'Build the lecture deck from the spec, in the course\u2019s style' },
  { kind: 'PR', n: 4, title: 'Make the demo\u2019s code panel editable, synced both ways' },
]
</script>

<template>
  <div class="viz factory">
    <section class="viz-card line">
      <div class="viz-label">The pipeline</div>
      <div class="stages">
        <template v-for="(s, i) in stages" :key="s.id">
          <Tip :text="s.tip" side="bottom">
            <div class="stage" :class="{ done: reached > i + 1, now: reached === i + 1, idle: reached <= i }">
              <span class="dot" />
              <span class="label">{{ s.label }}</span>
            </div>
          </Tip>
          <span v-if="i < stages.length - 1" class="link" :class="{ on: reached > i + 1 }" />
        </template>
      </div>

      <ol class="artifacts">
        <li v-for="(s, i) in stages.slice(0, reached)" :key="s.id" :class="{ latest: i === reached - 1 }">
          <span class="k">{{ s.label }}</span>
          <span class="v viz-mono">{{ s.artifact }}</span>
        </li>
        <li v-if="!reached" class="empty">{{ hint('Press → to file the issue.') }}</li>
      </ol>

      <div class="verdict viz-enter" :class="{ shown: at(stages.length) }">
        Nobody's laptop was involved until the last box. <b>Deciding</b> what to build and <b>judging</b> the result are the two jobs left for a person.
      </div>
    </section>

    <section class="viz-card meta">
      <div class="viz-label accent">This deck, built the same way</div>
      <ul>
        <li v-for="item in thisDeck" :key="item.n" :class="item.kind.toLowerCase()">
          <span class="viz-pill" :class="{ crimson: item.kind === 'Issue' }">{{ item.kind }} #{{ item.n }}</span>
          <span>{{ item.title }}</span>
        </li>
      </ul>
      <p class="note">Each commit's message says what was done and what was learned. The history is the receipt.</p>
    </section>
  </div>
</template>

<style scoped>
.factory {
  grid-template-columns: 1.6fr 1fr;
}
.stages {
  display: flex;
  align-items: center;
  margin: 0.2rem 0 0.8rem;
}
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 5rem;
  transition: opacity 250ms;
}
.stage.idle {
  opacity: 0.4;
}
.dot {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: 2px solid var(--cs50-border);
  background: #fff;
  transition: all 250ms;
}
.stage.done .dot {
  background: #198754;
  border-color: #198754;
}
.stage.now .dot {
  background: var(--cs50-crimson);
  border-color: var(--cs50-crimson);
  box-shadow: 0 0 0 4px rgba(165, 28, 48, 0.18);
}
.label {
  font-size: 0.74rem;
  font-weight: 700;
}
.stage.now .label {
  color: var(--cs50-crimson);
}
.link {
  flex: 1;
  height: 2px;
  background: var(--cs50-border);
  margin: 0 -1.2rem 1.2rem;
  transition: background-color 250ms;
}
.link.on {
  background: #198754;
}
.artifacts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  min-height: 0;
}
.artifacts li {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 0.6rem;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  font-size: 0.78rem;
  animation: rise 280ms ease both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
.artifacts li.latest {
  background: rgba(165, 28, 48, 0.06);
}
.k {
  font-weight: 700;
  color: var(--cs50-muted);
}
.artifacts li.latest .k {
  color: var(--cs50-crimson);
}
.v {
  font-size: 0.7rem;
  line-height: 1.4;
}
.empty {
  color: var(--cs50-muted);
  display: block !important;
  text-align: center;
}
.meta ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.78rem;
}
.meta li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  align-items: start;
  line-height: 1.35;
}
.meta .viz-pill {
  white-space: nowrap;
}
.note {
  margin: auto 0 0;
  padding-top: 0.6rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.78rem;
  color: var(--cs50-muted);
}
.verdict {
  margin-top: 0.5rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.86rem;
}
.verdict b {
  color: var(--cs50-crimson);
}
</style>
