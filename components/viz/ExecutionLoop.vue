<script setup lang="ts">
/**
 * ExecutionLoop — Concept 3. The think → act → observe loop, run by the
 * model, with the /sell transcript filling in one event per step. The human
 * from Concept 2 is shown outside the loop, with nothing to do.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

type Phase = 'think' | 'act' | 'observe'

interface Event {
  phase: Phase
  text: string
  /** Monospace detail line (a command or an output). */
  detail?: string
  status?: 'ok' | 'bad'
  /** Starts a new trip around the loop. */
  newLoop?: boolean
}

const events: Event[] = [
  { phase: 'think', text: 'Goal: implement /sell. Start from the buy route.', newLoop: true },
  { phase: 'act', text: 'Edit app.py', detail: 'write app.py  (+31 lines)' },
  { phase: 'act', text: 'Run the server and try it', detail: 'flask run\ncurl -X POST /sell -d "symbol=NFLX&shares=4"' },
  { phase: 'observe', text: 'It failed.', detail: 'HTTP 500\nsqlite3.OperationalError: no such column: shares', status: 'bad' },
  { phase: 'think', text: 'The table I designed for buy doesn\u2019t have that column. Check the schema.', newLoop: true },
  { phase: 'act', text: 'Look at the schema', detail: 'sqlite3 finance.db ".schema transactions"' },
  { phase: 'act', text: 'Fix the query, try again', detail: 'edit app.py  (-1 +1)\ncurl -X POST /sell -d "symbol=NFLX&shares=4"' },
  { phase: 'observe', text: 'It worked.', detail: 'HTTP 302 \u2192 /', status: 'ok' },
]

const { step, at } = useVizSteps(events.length)
const visible = computed(() => events.slice(0, step.value))
const current = computed<Phase | null>(() => (step.value > 0 ? events[step.value - 1].phase : null))
const loops = computed(() => visible.value.filter((e) => e.newLoop).length)
const done = computed(() => at(events.length))

const nodes: { id: Phase; label: string; tip: string; cx: number; cy: number }[] = [
  { id: 'think', label: 'Think', tip: 'Decide what to do next, from the goal and what was just observed.', cx: 100, cy: 48 },
  { id: 'act', label: 'Act', tip: 'Call a tool: edit a file, run a command, query the database.', cx: 168, cy: 150 },
  { id: 'observe', label: 'Observe', tip: 'Read the result: exit code, output, error, HTTP status.', cx: 32, cy: 150 },
]
</script>

<template>
  <div class="viz loop">
    <section class="viz-card diagram">
      <div class="viz-label">The loop <span v-if="loops" class="viz-pill" :class="{ crimson: !done, ok: done }">trip {{ loops }}</span></div>
      <svg viewBox="0 0 200 200" class="ring" aria-hidden="true">
        <defs>
          <marker id="loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#adb5bd" />
          </marker>
        </defs>
        <!-- think → act → observe → think -->
        <path d="M118,62 Q170,80 165,124" class="edge" marker-end="url(#loop-arrow)" />
        <path d="M142,160 Q100,180 58,160" class="edge" marker-end="url(#loop-arrow)" />
        <path d="M35,124 Q30,80 82,62" class="edge" marker-end="url(#loop-arrow)" />
        <g v-for="n in nodes" :key="n.id" :class="['node', n.id, { on: current === n.id }]">
          <circle :cx="n.cx" :cy="n.cy" r="26" />
          <text :x="n.cx" :y="n.cy + 4" text-anchor="middle">{{ n.label }}</text>
        </g>
      </svg>
      <div class="legend">
        <Tip v-for="n in nodes" :key="n.id" :text="n.tip">
          <span class="viz-pill" :class="{ crimson: current === n.id }">{{ n.label }}</span>
        </Tip>
      </div>
      <div class="human" :class="{ gone: at(1) }">
        <span class="icon">🧑‍💻</span>
        <span>{{ at(1) ? 'You: not in this loop.' : 'In Concept 2, you ran this loop by hand.' }}</span>
      </div>
    </section>

    <section class="viz-card log">
      <div class="viz-label">What happened <span class="viz-mono muted">/sell</span></div>
      <ol class="events">
        <li v-for="(e, i) in visible" :key="i" :class="[e.phase, { latest: i === step - 1 }]">
          <span class="phase">{{ e.phase }}</span>
          <div>
            <div class="text">{{ e.text }}</div>
            <pre v-if="e.detail" class="viz-mono" :class="e.status">{{ e.detail }}</pre>
          </div>
        </li>
        <li v-if="!visible.length" class="empty">Press → to start the loop.</li>
      </ol>
      <div class="verdict viz-enter" :class="{ shown: done }">
        Two trips around the loop. It read its own error and fixed it. <b>Nobody pasted anything.</b>
      </div>
    </section>
  </div>
</template>

<style scoped>
.loop {
  grid-template-columns: 1fr 1.4fr;
}
.ring {
  width: 100%;
  max-height: 230px;
  flex: 1;
  min-height: 0;
}
.edge {
  fill: none;
  stroke: #adb5bd;
  stroke-width: 2;
}
.node circle {
  fill: #fff;
  stroke: var(--cs50-border);
  stroke-width: 2;
  transition: all 250ms;
}
.node text {
  font-family: 'PT Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  fill: var(--cs50-body);
  transition: fill 250ms;
}
.node.on circle {
  fill: var(--cs50-crimson);
  stroke: var(--cs50-crimson);
}
.node.on text {
  fill: #fff;
}
.legend {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 0.3rem;
}
.human {
  margin-top: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: var(--cs50-muted);
  border-top: 1px dashed var(--cs50-rule);
  padding-top: 0.5rem;
  transition: opacity 300ms;
}
.human.gone .icon {
  filter: grayscale(1);
  opacity: 0.4;
  text-decoration: line-through;
}
.muted {
  color: var(--cs50-muted);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  margin-left: 0.4rem;
}
.events {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.3rem;
}
.events li {
  display: grid;
  grid-template-columns: 4.2rem 1fr;
  gap: 0.5rem;
  align-items: start;
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  animation: rise 280ms ease both;
  font-size: 0.8rem;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
.events li.latest {
  background: rgba(165, 28, 48, 0.06);
}
.phase {
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--cs50-muted);
  padding-top: 0.15rem;
}
.events li.latest .phase {
  color: var(--cs50-crimson);
}
.text {
  line-height: 1.35;
}
pre {
  margin: 0.2rem 0 0;
  padding: 0.3rem 0.5rem;
  font-size: 0.66rem;
  line-height: 1.4;
  background: var(--cs50-code-bg);
  border: 1px solid var(--cs50-border);
  border-radius: 4px;
  white-space: pre-wrap;
}
pre.bad {
  border-color: #f1aeb5;
  background: #f8d7da;
  color: #58151c;
}
pre.ok {
  border-color: #a3cfbb;
  background: #d1e7dd;
  color: #0a3622;
}
.empty {
  color: var(--cs50-muted);
  text-align: center;
  justify-content: center;
  display: block !important;
}
.verdict {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.86rem;
}
.verdict b {
  color: var(--cs50-crimson);
}
</style>
