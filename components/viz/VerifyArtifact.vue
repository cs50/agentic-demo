<script setup lang="ts">
/**
 * VerifyArtifact — Concept 7. Left: a thousand generated lines scrolling by,
 * unreadable. Right: the evidence from the spec's own test plan (register,
 * buy 10 NFLX, sell 4, open /history), checked against what the spec requires
 * of the history page.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'

const { step, at, is } = useVizSteps(4)

// Deterministic "generated code": enough lines to be hopeless, no randomness.
const words = ['db.execute(', 'session["user_id"]', 'render_template(', 'request.form.get(', 'return apology(', 'lookup(symbol)', 'for row in rows:', 'if not', 'usd(total)', 'redirect("/")', 'shares * price', 'history.append(']
const lines = Array.from({ length: 1000 }, (_, i) => {
  const indent = '    '.repeat((i * 7) % 4)
  return `${indent}${words[(i * 13) % words.length]} ${words[(i * 5 + 3) % words.length]}`
})

const rows = [
  { type: 'BUY', symbol: 'NFLX', price: '$436.61', shares: 10, when: '2026-11-20 10:14:03' },
  { type: 'SELL', symbol: 'NFLX', price: '$441.02', shares: 4, when: '2026-11-20 10:15:37' },
]

const checks = [
  { id: 'type', text: 'whether a stock was bought or sold', col: 0 },
  { id: 'symbol', text: 'the stock\u2019s symbol', col: 1 },
  { id: 'price', text: 'the (purchase or sale) price', col: 2 },
  { id: 'shares', text: 'the number of shares', col: 3 },
  { id: 'when', text: 'the date and time of the transaction', col: 4 },
]

/** Checks tick in two groups on steps 3 and 4. */
const ticked = computed(() => (at(4) ? 5 : at(3) ? 2 : 0))
</script>

<template>
  <div class="viz verify">
    <section class="viz-card code" :class="{ hopeless: at(1) }">
      <div class="viz-label">The code <span class="viz-pill">1,000 lines</span></div>
      <div class="scroller" :class="{ run: at(1) && !at(2) }">
        <pre class="viz-mono">{{ lines.join('\n') }}</pre>
      </div>
      <div class="overlay" :class="{ shown: at(1) }">
        <template v-if="is(1)">You could read this. At one line a second, it takes seventeen minutes, and you'd still miss the bug on line 612.</template>
        <template v-else-if="at(2)">Don't review the code.</template>
      </div>
    </section>

    <section class="viz-card evidence viz-enter" :class="{ shown: at(2) }">
      <div class="viz-label accent">The evidence</div>
      <div class="plan viz-mono">register → buy 10 NFLX → sell 4 → GET /history</div>
      <table>
        <thead>
          <tr>
            <th v-for="(c, i) in checks" :key="c.id" :class="{ hot: ticked > i }">{{ ['Type', 'Symbol', 'Price', 'Shares', 'Transacted'][i] }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.when">
            <td :class="{ hot: ticked > 0 }"><span class="viz-pill" :class="r.type === 'BUY' ? 'ok' : 'crimson'">{{ r.type }}</span></td>
            <td :class="{ hot: ticked > 1 }" class="viz-mono">{{ r.symbol }}</td>
            <td :class="{ hot: ticked > 2 }" class="viz-mono">{{ r.price }}</td>
            <td :class="{ hot: ticked > 3 }" class="viz-mono">{{ r.shares }}</td>
            <td :class="{ hot: ticked > 4 }" class="viz-mono">{{ r.when }}</td>
          </tr>
        </tbody>
      </table>

      <div class="viz-label">What the spec requires of /history</div>
      <ul class="checks">
        <li v-for="(c, i) in checks" :key="c.id" :class="{ on: ticked > i }">
          <span class="box"><svg v-if="ticked > i" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5 5 9l4.5-6" /></svg></span>
          <span>{{ c.text }}</span>
        </li>
      </ul>

      <div class="verdict viz-enter" :class="{ shown: at(4) }">
        Two rows meet all five requirements. <b>history works</b>, and you never opened the template.
      </div>
    </section>
  </div>
</template>

<style scoped>
.verify {
  grid-template-columns: 1fr 1.3fr;
}
.code {
  position: relative;
  overflow: hidden;
}
.scroller {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  background: var(--cs50-code-bg);
}
.scroller pre {
  margin: 0;
  padding: 0.4rem 0.6rem;
  font-size: 0.6rem;
  line-height: 1.35;
  color: var(--cs50-muted);
}
.scroller.run pre {
  animation: scroll 6s linear infinite;
}
@keyframes scroll {
  to {
    transform: translateY(-60%);
  }
}
.hopeless .scroller pre {
  filter: blur(0.6px);
}
.overlay {
  position: absolute;
  inset: auto 0.9rem 0.9rem;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  font-size: 0.86rem;
  line-height: 1.45;
  opacity: 0;
  transform: translateY(8px);
  transition: all 300ms;
}
.overlay.shown {
  opacity: 1;
  transform: none;
}
.plan {
  font-size: 0.7rem;
  color: var(--cs50-muted);
  margin-bottom: 0.5rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  margin-bottom: 0.8rem;
}
th,
td {
  text-align: left;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--cs50-border);
  transition: background-color 250ms;
}
th {
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cs50-muted);
  border-bottom: 2px solid var(--cs50-body);
}
th.hot {
  color: var(--cs50-crimson);
}
td.hot {
  background: rgba(165, 28, 48, 0.06);
}
.checks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem 1rem;
  font-size: 0.8rem;
}
.checks li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--cs50-muted);
  transition: color 250ms;
}
.checks li.on {
  color: var(--cs50-body);
}
.box {
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid var(--cs50-border);
  border-radius: 3px;
  display: grid;
  place-items: center;
  transition: all 250ms;
}
.box svg {
  width: 0.75rem;
  height: 0.75rem;
  fill: none;
  stroke: #fff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.checks li.on .box {
  background: #198754;
  border-color: #198754;
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
