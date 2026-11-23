<script setup lang="ts">
/**
 * TokenPredictor — Concept 1. A model completes `def quote():` one chunk at a
 * time. Each step shows the candidates it chose between, with probabilities.
 * The last step points out that "most likely" is not "correct".
 */
import { computed, ref } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import { hint, SHOW_HINTS } from './config'

interface Step {
  /** The chunk appended to the code. */
  text: string
  /** Top candidates, chosen first. */
  candidates: { text: string; p: number; note?: string }[]
}

const prompt = 'def quote():\n'

const steps: Step[] = [
  {
    text: '    if request.method == "POST":\n',
    candidates: [
      { text: 'if request.method == "POST":', p: 0.71 },
      { text: 'return render_template("quote.html")', p: 0.14 },
      { text: 'symbol = request.form.get("symbol")', p: 0.09 },
      { text: 'pass', p: 0.03 },
    ],
  },
  {
    text: '        symbol = request.form.get("symbol")\n',
    candidates: [
      { text: 'symbol = request.form.get("symbol")', p: 0.83 },
      { text: 'symbol = request.form["symbol"]', p: 0.11 },
      { text: 'if not request.form.get("symbol"):', p: 0.04 },
    ],
  },
  {
    text: '        quote = lookup(symbol)\n',
    candidates: [
      { text: 'quote = lookup(symbol)', p: 0.64 },
      { text: 'if not symbol:', p: 0.19, note: 'the spec wants this check; it lost' },
      { text: 'quote = lookup(symbol.upper())', p: 0.11 },
      { text: 'price = get_price(symbol)', p: 0.04 },
    ],
  },
  {
    text: '        return render_template("quoted.html", quote=quote)\n',
    candidates: [
      { text: 'return render_template("quoted.html", quote=quote)', p: 0.58 },
      { text: 'if quote is None:', p: 0.27, note: 'lookup returns None for a bad symbol; also lost' },
      { text: 'return jsonify(quote)', p: 0.09 },
    ],
  },
  {
    text: '    return render_template("quote.html")\n',
    candidates: [
      { text: 'return render_template("quote.html")', p: 0.9 },
      { text: 'else:', p: 0.07 },
    ],
  },
]

const { step, at } = useVizSteps(steps.length + 1)

const shown = computed(() => Math.min(step.value, steps.length))
const code = computed(() => prompt + steps.slice(0, shown.value).map((s) => s.text).join(''))

/** Which step's candidates to show: hovered line, else the latest. */
const hovered = ref<number | null>(null)
const focus = computed(() => hovered.value ?? (shown.value > 0 ? shown.value - 1 : null))
const candidates = computed(() => (focus.value == null ? [] : steps[focus.value].candidates))

const lines = computed(() => code.value.trimEnd().split('\n'))
</script>

<template>
  <div class="viz tokens">
    <section class="viz-card code">
      <div class="viz-label">What the model writes</div>
      <pre class="viz-mono"><span
        v-for="(line, i) in lines"
        :key="i"
        class="line"
        :class="{ prompt: i === 0, latest: i === shown && !at(steps.length + 1), hover: hovered === i - 1 }"
        @mouseenter="i > 0 && (hovered = i - 1)"
        @mouseleave="hovered = null"
      >{{ line }}</span><span v-if="shown < steps.length" class="caret">▌</span></pre>
      <div v-if="SHOW_HINTS" class="hint">Hover a line to see what it beat.</div>
    </section>

    <section class="viz-card cands">
      <div class="viz-label">What it chose between</div>
      <div v-if="!candidates.length" class="empty">{{ hint('Press → to predict the first line.') }}</div>
      <ol v-else class="list">
        <li v-for="(c, i) in candidates" :key="c.text" :class="{ pick: i === 0, lost: c.note }">
          <span class="bar" :style="{ width: `${c.p * 100}%` }" />
          <span class="p viz-mono">{{ (c.p * 100).toFixed(0) }}%</span>
          <code class="viz-mono">{{ c.text }}</code>
          <span v-if="c.note" class="note">{{ c.note }}</span>
        </li>
      </ol>
      <div class="verdict viz-enter" :class="{ shown: at(steps.length + 1) }">
        Five times it picked the <b>most likely</b> line. Twice, the <b>correct</b> line was the runner-up.
        Nothing here knows what <code class="viz-mono">lookup</code> returns.
      </div>
    </section>
  </div>
</template>

<style scoped>
.tokens {
  grid-template-columns: 1.15fr 1fr;
}
pre {
  margin: 0;
  flex: 1;
  font-size: 0.82rem;
  line-height: 1.7;
  background: var(--cs50-code-bg);
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  overflow: hidden;
  white-space: pre;
}
.line {
  display: block;
  border-radius: 3px;
  transition: background-color 200ms;
}
.line.prompt {
  color: var(--cs50-muted);
}
.line.latest {
  background: rgba(165, 28, 48, 0.1);
}
.line.hover {
  background: rgba(165, 28, 48, 0.16);
}
.caret {
  color: var(--cs50-crimson);
  animation: blink 1s steps(2) infinite;
}
@keyframes blink {
  to {
    opacity: 0;
  }
}
.hint {
  margin-top: 0.4rem;
  font-size: 0.7rem;
  color: var(--cs50-muted);
}
.empty {
  color: var(--cs50-muted);
  margin: auto 0;
  text-align: center;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.list li {
  position: relative;
  display: grid;
  grid-template-columns: 3rem 1fr;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.74rem;
}
.list li .bar {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--cs50-rule);
  z-index: 0;
  transition: width 400ms ease;
}
.list li.pick .bar {
  background: rgba(165, 28, 48, 0.14);
}
.list li.pick {
  border-color: var(--cs50-crimson);
}
.list li > * {
  position: relative;
  z-index: 1;
}
.p {
  font-weight: 700;
  color: var(--cs50-body);
}
.list li.pick .p {
  color: var(--cs50-crimson);
}
.list code {
  display: block;
  font-size: 0.72rem;
  color: var(--cs50-body);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.35;
}
.note {
  grid-column: 2;
  font-size: 0.66rem;
  color: var(--cs50-crimson);
  font-weight: 700;
}
.verdict {
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.86rem;
  line-height: 1.45;
}
.verdict b {
  color: var(--cs50-crimson);
}
</style>
