<script setup lang="ts">
/**
 * SpecChecks — Concept 5. The four `buy` rules from the Finance spec beside
 * a form. Each step submits one preset input; the rule that catches it lights
 * up and the apology appears. A spec is a set of checks you can run.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import { hint } from './config'

const rules = [
  { id: 1, text: 'symbol is non-blank and exists per lookup', tip: 'lookup returns None for an unknown symbol.' },
  { id: 2, text: 'shares is a positive integer', tip: 'Not zero, not negative, not 1.5, not "five".' },
  { id: 3, text: 'the user can afford shares × price', tip: 'Compare against cash in users, before writing anything.' },
  { id: 4, text: 'otherwise: record the purchase, redirect to /', tip: 'The only path that writes to the database.' },
]

interface Attempt {
  symbol: string
  shares: string
  /** Rule that fails, or null if all pass. */
  fails: number | null
  result: string
  spec: string
}

const attempts: Attempt[] = [
  { symbol: 'NFLX', shares: '5', fails: null, result: 'Bought! Redirecting to /', spec: '"Upon completion, redirect the user to the home page."' },
  { symbol: 'NFLX', shares: '-5', fails: 2, result: 'apology: shares must be a positive integer', spec: '"Render an apology if the input is not a positive integer."' },
  { symbol: 'ZZZZ', shares: '5', fails: 1, result: 'apology: invalid symbol', spec: '"Render an apology if \u2026 the symbol does not exist (as per the return value of lookup)."' },
  { symbol: 'NFLX', shares: '999999', fails: 3, result: 'apology: can\u2019t afford', spec: '"Render an apology, without completing a purchase, if the user cannot afford the number of shares at the current price."' },
  { symbol: 'NFLX', shares: '1.5', fails: 2, result: 'apology: shares must be a positive integer', spec: 'The "unexpected usage" list: "inputting floating-point values into forms when only integers are expected".' },
]

const { step, at } = useVizSteps(attempts.length + 1)
const idx = computed(() => Math.min(step.value, attempts.length) - 1)
const current = computed(() => (idx.value >= 0 ? attempts[idx.value] : null))

/** Rule state for the current attempt: pass / fail / untested (after a failure). */
function state(ruleId: number): 'pass' | 'fail' | 'skip' | 'idle' {
  const a = current.value
  if (!a) return 'idle'
  if (a.fails === null) return 'pass'
  if (ruleId < a.fails) return 'pass'
  if (ruleId === a.fails) return 'fail'
  return 'skip'
}

const history = computed(() => attempts.slice(0, Math.min(step.value, attempts.length)))
</script>

<template>
  <div class="viz spec">
    <section class="viz-card form">
      <div class="viz-label">Buy</div>
      <label>Symbol <input class="viz-mono" :value="current?.symbol ?? ''" readonly placeholder="symbol" /></label>
      <label>Shares <input class="viz-mono" :value="current?.shares ?? ''" readonly placeholder="shares" /></label>
      <button type="button" class="submit" :class="{ pulse: current }" disabled>Buy</button>
      <div class="result" :class="{ ok: current && current.fails === null, bad: current && current.fails !== null }">
        {{ current ? current.result : hint('Press → to submit the first input.') }}
      </div>
      <div class="history">
        <span v-for="(a, i) in history" :key="i" class="viz-pill" :class="a.fails === null ? 'ok' : 'bad'">{{ a.symbol }} · {{ a.shares }}</span>
      </div>
    </section>

    <section class="viz-card rules">
      <div class="viz-label accent">The spec, as checks</div>
      <ol>
        <li v-for="r in rules" :key="r.id" :class="state(r.id)" :title="r.tip">
          <span class="mark">
            <template v-if="state(r.id) === 'pass'">✓</template>
            <template v-else-if="state(r.id) === 'fail'">✕</template>
            <template v-else>{{ r.id }}</template>
          </span>
          <span class="text">{{ r.text }}</span>
        </li>
      </ol>
      <blockquote v-if="current" class="quote">{{ current.spec }}</blockquote>
      <div class="verdict viz-enter" :class="{ shown: at(attempts.length + 1) }">
        Five inputs, four rules, one path through. You didn't write the code; you wrote <b>what the code must do</b>, and you can check it.
      </div>
    </section>
  </div>
</template>

<style scoped>
.spec {
  grid-template-columns: 1fr 1.5fr;
}
.form label {
  display: grid;
  grid-template-columns: 4rem 1fr;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
.form input {
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
  background: #fff;
  color: var(--cs50-body);
}
.submit {
  margin: 0.3rem 0 0.9rem auto;
  padding: 0.4rem 1.1rem;
  background: var(--cs50-crimson);
  color: #fff;
  border: 0;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
}
.submit.pulse {
  animation: pulse 500ms ease;
}
@keyframes pulse {
  40% {
    transform: scale(0.94);
  }
}
.result {
  padding: 0.55rem 0.7rem;
  border-radius: 6px;
  border: 1px solid var(--cs50-border);
  background: var(--cs50-code-bg);
  font-size: 0.85rem;
  min-height: 3em;
  color: var(--cs50-muted);
  transition: all 250ms;
}
.result.ok {
  background: #d1e7dd;
  border-color: #a3cfbb;
  color: #0a3622;
  font-weight: 700;
}
.result.bad {
  background: #f8d7da;
  border-color: #f1aeb5;
  color: #58151c;
  font-weight: 700;
}
.history {
  margin-top: auto;
  padding-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.history .viz-pill {
  font-family: ui-monospace, Menlo, monospace;
  font-weight: 400;
}
ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
li {
  display: grid;
  grid-template-columns: 1.6rem 1fr;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  font-size: 0.88rem;
  transition: all 250ms;
}
.mark {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.8rem;
  background: var(--cs50-rule);
  color: var(--cs50-muted);
}
li.pass {
  border-color: #a3cfbb;
}
li.pass .mark {
  background: #198754;
  color: #fff;
}
li.fail {
  border-color: var(--cs50-crimson);
  background: rgba(165, 28, 48, 0.06);
}
li.fail .mark {
  background: var(--cs50-crimson);
  color: #fff;
}
li.fail .text {
  font-weight: 700;
}
li.skip {
  opacity: 0.4;
}
.quote {
  margin: 0.7rem 0 0;
  padding-left: 0.8rem;
  border-left: 3px solid var(--cs50-border);
  font-size: 0.78rem;
  color: var(--cs50-muted);
  line-height: 1.4;
  background: transparent;
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
