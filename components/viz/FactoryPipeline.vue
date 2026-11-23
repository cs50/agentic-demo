<script setup lang="ts">
/**
 * FactoryPipeline — Concept 9. An issue travels issue → sandbox → plan →
 * implement → test → PR, one stage per step, for a Finance 'personal touch'.
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
  { id: 'implement', label: 'Implement', tip: 'The change itself, on a branch of its own.', artifact: 'app.py +22 · templates/deposit.html +18 · layout.html +1' },
  { id: 'test', label: 'Test', tip: 'The spec\u2019s test plan plus the new case, run on the sandbox.', artifact: 'deposit $500 → cash +500.00 ✓ · deposit -5 → apology ✓ · check50 ✓' },
  { id: 'pr', label: 'Pull request', tip: 'A summary of what changed and why, with the test results attached. This is where you come in.', artifact: 'PR #6 "Add cash deposits" · 3 files · ready for review' },
]

const { step, at } = useVizSteps(stages.length)
const reached = computed(() => step.value)

</script>

<template>
  <div class="viz factory">
    <section class="viz-card line">
      <div class="viz-label">The pipeline</div>
      <div class="stages">
        <div class="track"><span class="progress" :style="{ width: `${(Math.max(reached, 1) - 1) / (stages.length - 1) * 100}%` }" /></div>
        <Tip v-for="(s, i) in stages" :key="s.id" :text="s.tip" side="bottom">
          <div class="stage" :class="{ done: reached > i + 1, now: reached === i + 1, idle: reached <= i }">
            <span class="dot" />
            <span class="label">{{ s.label }}</span>
          </div>
        </Tip>
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

  </div>
</template>

<style scoped>
.factory {
  grid-template-columns: 1fr;
}
.stages {
  position: relative;
  display: flex;
  justify-content: space-between;
  margin: 0.2rem 0 0.8rem;
  padding: 0 1rem;
}
.track {
  position: absolute;
  left: 3.5rem;
  right: 3.5rem;
  top: 0.55rem;
  height: 2px;
  background: var(--cs50-border);
}
.progress {
  display: block;
  height: 100%;
  background: #198754;
  transition: width 400ms ease;
}
.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: 5rem;
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
.artifacts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
  min-height: 0;
}
.artifacts li {
  display: grid;
  grid-template-columns: 6.5rem 1fr;
  gap: 0.8rem;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  font-size: 0.92rem;
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
  font-size: 0.82rem;
  line-height: 1.45;
}
.empty {
  color: var(--cs50-muted);
  display: block !important;
  text-align: center;
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
