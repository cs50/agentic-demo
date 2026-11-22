<script setup lang="ts">
/**
 * Guardrails — Concept 6. The same change goes through two gates: a prompt
 * ("please avoid SQL injection"), which anything can pass, and a scanner that
 * fails the build on a string-built query. A prompt is a request; a check is
 * a wall.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import { hint } from './config'
import CodeSnippet from './CodeSnippet.vue'
import Tip from './Tip.vue'

const unsafe = `rows = db.execute(
    f"SELECT * FROM users WHERE username = '{username}'"
)`
const safe = `rows = db.execute(
    "SELECT * FROM users WHERE username = ?", username
)`

const { step, at, is } = useVizSteps(4)

/** Which variant is travelling the pipeline right now. */
const variant = computed(() => (step.value >= 3 ? 'safe' : 'unsafe'))

const gates = [
  {
    id: 'prompt',
    label: 'The prompt',
    rule: '"Please avoid SQL injection vulnerabilities."',
    tip: 'Natural language. The model may comply, forget, or misunderstand. Nothing enforces it.',
  },
  {
    id: 'scanner',
    label: 'The scanner',
    rule: 'fail if a query string is built with f"…", + or .format()',
    tip: 'A few lines of code in the build pipeline. It does not negotiate.',
  },
]

/** Outcome at each gate for the current step. */
function outcome(gate: 'prompt' | 'scanner'): 'wait' | 'pass' | 'fail' {
  if (variant.value === 'unsafe') {
    if (gate === 'prompt') return at(1) ? 'pass' : 'wait'
    return at(2) ? 'fail' : 'wait'
  }
  if (gate === 'prompt') return at(3) ? 'pass' : 'wait'
  return at(4) ? 'pass' : 'wait'
}

const merged = computed(() => at(4))
</script>

<template>
  <div class="viz guard">
    <section class="viz-card change">
      <div class="viz-label">The change <span class="viz-pill" :class="variant === 'safe' ? 'ok' : 'bad'">{{ variant === 'safe' ? 'version 2' : 'version 1' }}</span></div>
      <CodeSnippet :code="variant === 'safe' ? safe : unsafe" lang="python" :mark="variant === 'unsafe' && at(2) ? [2] : []" />
      <div class="attack viz-enter" :class="{ shown: at(2) && variant === 'unsafe' }">
        <div class="viz-label">With <span class="viz-mono">username = ' OR 1=1 --</span></div>
        <pre class="viz-mono">SELECT * FROM users WHERE username = '' OR 1=1 --'</pre>
        <p>Every user, every hash.</p>
      </div>
      <div class="hint viz-enter" :class="{ shown: at(3) }">
        The spec's hint, verbatim: use <span class="viz-mono">?</span> placeholders; do <b>not</b> use f-strings, <span class="viz-mono">format</span>, or <span class="viz-mono">+</span>.
      </div>
    </section>

    <section class="viz-card pipeline">
      <div class="viz-label">Two gates</div>
      <div class="lane">
        <template v-for="g in gates" :key="g.id">
          <Tip :text="g.tip" side="bottom">
            <div class="gate" :class="[outcome(g.id as 'prompt' | 'scanner'), { soft: g.id === 'prompt' }]">
              <div class="name">{{ g.label }}</div>
              <div class="rule viz-mono">{{ g.rule }}</div>
              <div class="status">
                <template v-if="outcome(g.id as any) === 'pass'">✓ passed</template>
                <template v-else-if="outcome(g.id as any) === 'fail'">✕ build failed</template>
                <template v-else>…</template>
              </div>
            </div>
          </Tip>
          <span class="arrow" aria-hidden="true">↓</span>
        </template>
        <div class="gate end" :class="{ on: merged }">
          <div class="name">Merged</div>
          <div class="status">{{ merged ? '✓ shipped' : '…' }}</div>
        </div>
      </div>

      <div class="caption" :class="{ bad: is(2), ok: is(4) }">
        <template v-if="is(1)">The prompt said please. The f-string went straight through.</template>
        <template v-else-if="is(2)">The scanner read line 2 and stopped the build. No argument.</template>
        <template v-else-if="is(3)">Version 2 passes the prompt too. The prompt was never the hard part.</template>
        <template v-else-if="is(4)">Version 2 passes the scanner. Merged.</template>
        <template v-else>{{ hint('Press → to send version 1 through.') }}</template>
      </div>

      <div class="verdict viz-enter" :class="{ shown: at(4) }">
        The prompt passed both versions. The scanner passed one. <b>Only one of them is a boundary.</b>
      </div>
    </section>
  </div>
</template>

<style scoped>
.guard {
  grid-template-columns: 1fr 1.25fr;
}
.change :deep(.snippet pre) {
  font-size: 0.86rem;
  line-height: 1.7;
}
.attack {
  margin-top: 0.7rem;
}
.attack pre {
  margin: 0;
  padding: 0.5rem 0.7rem;
  font-size: 0.78rem;
  background: #f8d7da;
  border: 1px solid #f1aeb5;
  border-radius: 6px;
  color: #58151c;
  white-space: pre-wrap;
}
.attack p {
  margin: 0.4rem 0 0;
  font-size: 0.95rem;
  color: #58151c;
  font-weight: 700;
}
.hint {
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.9rem;
  color: var(--cs50-muted);
}
.hint b {
  color: var(--cs50-crimson);
}
.lane {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.15rem;
  min-width: 0;
}
.lane :deep(.tip) {
  display: block;
}
.gate {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'name status'
    'rule rule';
  align-items: center;
  column-gap: 0.8rem;
  row-gap: 0.2rem;
  width: 100%;
  min-width: 0;
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  background: #fff;
  transition: all 250ms;
}
.gate .name {
  grid-area: name;
}
.gate .rule {
  grid-area: rule;
}
.gate .status {
  grid-area: status;
}
.gate.soft {
  border-style: dashed;
}
.gate .name {
  font-weight: 700;
  font-size: 1rem;
}
.gate .rule {
  font-size: 0.74rem;
  color: var(--cs50-muted);
  line-height: 1.35;
  min-width: 0;
  overflow-wrap: anywhere;
}
.gate .status {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--cs50-muted);
  white-space: nowrap;
  text-align: right;
}
.gate.pass {
  border-color: #a3cfbb;
}
.gate.pass .status {
  color: #198754;
}
.gate.fail {
  border-color: var(--cs50-crimson);
  background: rgba(165, 28, 48, 0.06);
}
.gate.fail .status {
  color: var(--cs50-crimson);
}
.gate.end {
  grid-template-areas: 'name status';
}
.gate.end.on {
  border-color: #198754;
  background: #d1e7dd;
}
.gate.end.on .status {
  color: #198754;
}
.arrow {
  align-self: center;
  color: var(--cs50-muted);
  font-size: 1.1rem;
  line-height: 1;
}
.caption {
  margin-top: 1.1rem;
  font-size: 1.02rem;
  line-height: 1.45;
  min-height: 2.9em;
  color: var(--cs50-body);
}
.caption.bad {
  color: #58151c;
}
.caption.ok {
  color: #0a3622;
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
