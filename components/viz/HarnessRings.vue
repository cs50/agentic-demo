<script setup lang="ts">
/**
 * HarnessRings — Concept 4. The model in the middle, the harness around it
 * (permissions, sandbox, context), the environment outside. Steps show the
 * harness doing its two jobs: injecting the schema in, and stopping a
 * destructive command on the way out.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

const { step, at, is } = useVizSteps(4)

const segments = [
  { id: 'permissions', label: 'Permissions', tip: 'Which commands and SQL statements may run without asking you.', angle: -90 },
  { id: 'sandbox', label: 'Sandbox', tip: 'Which files and directories the model may read or write.', angle: 30 },
  { id: 'context', label: 'Context', tip: 'What the model is told about your project before it starts.', angle: 150 },
]

const env = [
  { id: 'db', label: 'finance.db', x: 420, y: 70 },
  { id: 'app', label: 'app.py', x: 420, y: 200 },
  { id: 'shell', label: 'shell', x: 60, y: 200 },
]

const message = computed(() => {
  switch (step.value) {
    case 1:
      return { text: 'Three jobs, all outside the model.', tone: '' }
    case 2:
      return { text: 'Before anything runs, the harness reads .schema and puts it in context. Now the model knows users has id, username, hash, cash.', tone: 'ok' }
    case 3:
      return { text: 'The model proposes DROP TABLE users "to start fresh". Permissions stops it and asks you.', tone: 'bad' }
    case 4:
      return { text: 'The model proposes SELECT cash FROM users WHERE id = ?. Read-only, parameterised: through it goes.', tone: 'ok' }
    default:
      return { text: 'Press → to label the rings.', tone: '' }
  }
})

const schema = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  username TEXT NOT NULL,
  hash TEXT NOT NULL,
  cash NUMERIC NOT NULL DEFAULT 10000.00
);`
</script>

<template>
  <div class="viz harness">
    <section class="viz-card picture">
      <svg viewBox="0 0 480 270" class="rings" aria-hidden="true">
        <!-- environment -->
        <g v-for="e in env" :key="e.id" class="env" :class="{ on: (is(2) && e.id === 'db') || (is(3) && e.id === 'db') || (is(4) && e.id === 'db') }">
          <rect :x="e.x - 44" :y="e.y - 16" width="88" height="32" rx="6" />
          <text :x="e.x" :y="e.y + 4" text-anchor="middle">{{ e.label }}</text>
        </g>

        <!-- harness ring -->
        <g class="ring" :class="{ shown: at(1) }">
          <circle cx="240" cy="135" r="92" class="ring-bg" />
          <g v-for="s in segments" :key="s.id" :class="['seg', s.id, { hot: (is(2) && s.id === 'context') || (is(3) && s.id === 'permissions') || (is(4) && s.id === 'permissions') }]">
            <text
              :x="240 + 92 * Math.cos((s.angle * Math.PI) / 180)"
              :y="135 + 92 * Math.sin((s.angle * Math.PI) / 180) + 4"
              text-anchor="middle"
            >
              {{ s.label }}
            </text>
          </g>
        </g>

        <!-- model -->
        <g class="model">
          <circle cx="240" cy="135" r="40" />
          <text x="240" y="139" text-anchor="middle">Model</text>
        </g>

        <!-- step 2: schema flows in -->
        <g class="flow in" :class="{ shown: is(2) }">
          <path d="M376,80 C330,95 300,110 282,122" marker-end="url(#h-arrow-ok)" />
          <text x="340" y="88">.schema</text>
        </g>
        <!-- step 3: DROP TABLE blocked -->
        <g class="flow bad" :class="{ shown: is(3) }">
          <path d="M262,100 C275,80 290,60 300,48" />
          <text x="268" y="40" class="cmd">DROP TABLE users</text>
          <g class="block">
            <circle cx="300" cy="48" r="11" />
            <path d="M294,42 L306,54 M306,42 L294,54" />
          </g>
          <text x="318" y="52" class="ask">asks you first</text>
        </g>
        <!-- step 4: SELECT passes -->
        <g class="flow ok" :class="{ shown: is(4) }">
          <path d="M276,120 C330,105 360,90 376,78" marker-end="url(#h-arrow-ok)" />
          <text x="286" y="104" class="cmd">SELECT cash FROM users WHERE id = ?</text>
        </g>

        <defs>
          <marker id="h-arrow-ok" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#198754" />
          </marker>
        </defs>
      </svg>

      <div class="legend">
        <Tip v-for="s in segments" :key="s.id" :text="s.tip">
          <span class="viz-pill" :class="{ crimson: (is(2) && s.id === 'context') || ((is(3) || is(4)) && s.id === 'permissions') }">{{ s.label }}</span>
        </Tip>
      </div>
    </section>

    <section class="viz-card side">
      <div class="viz-label">What the harness did</div>
      <p class="msg" :class="message.tone">{{ message.text }}</p>
      <div class="viz-enter" :class="{ shown: at(2) }">
        <div class="viz-label">In the model's context</div>
        <pre class="viz-mono">{{ schema }}</pre>
      </div>
      <div class="verdict viz-enter" :class="{ shown: at(4) }">
        Same model both times. The <b>harness</b> decided what it saw and what it was allowed to do.
      </div>
    </section>
  </div>
</template>

<style scoped>
.harness {
  grid-template-columns: 1.4fr 1fr;
}
.rings {
  width: 100%;
  flex: 1;
  min-height: 0;
}
.env rect {
  fill: #fff;
  stroke: var(--cs50-border);
  stroke-width: 1.5;
  transition: all 250ms;
}
.env text,
.ring text,
.model text,
.flow text {
  font-family: 'PT Sans', sans-serif;
  font-size: 12px;
  fill: var(--cs50-body);
}
.env.on rect {
  stroke: var(--cs50-crimson);
}
.ring {
  opacity: 0;
  transition: opacity 400ms;
}
.ring.shown {
  opacity: 1;
}
.ring-bg {
  fill: none;
  stroke: var(--cs50-border);
  stroke-width: 26;
}
.seg text {
  font-weight: 700;
  font-size: 11px;
  fill: var(--cs50-muted);
  transition: fill 250ms;
}
.seg.hot text {
  fill: var(--cs50-crimson);
}
.model circle {
  fill: var(--cs50-code-bg);
  stroke: var(--cs50-body);
  stroke-width: 2;
}
.model text {
  font-weight: 700;
  font-size: 13px;
}
.flow {
  opacity: 0;
  transition: opacity 300ms;
}
.flow.shown {
  opacity: 1;
}
.flow path {
  fill: none;
  stroke-width: 2;
}
.flow.in path,
.flow.ok path {
  stroke: #198754;
}
.flow.bad path {
  stroke: #dc3545;
  stroke-dasharray: 4 3;
}
.flow text {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 10px;
  fill: var(--cs50-body);
}
.flow.in text {
  fill: #198754;
  font-weight: 700;
}
.block circle {
  fill: #f8d7da;
  stroke: #dc3545;
  stroke-width: 2;
}
.block path {
  stroke: #dc3545;
  stroke-width: 2.5;
}
.ask {
  font-family: 'PT Sans', sans-serif !important;
  font-weight: 700;
  fill: #dc3545 !important;
  font-size: 11px !important;
}
.legend {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
}
.msg {
  margin: 0 0 0.8rem;
  font-size: 0.9rem;
  line-height: 1.45;
  min-height: 4.2em;
  transition: color 250ms;
}
.msg.ok {
  color: #0a3622;
}
.msg.bad {
  color: #58151c;
}
pre {
  margin: 0;
  padding: 0.5rem 0.6rem;
  font-size: 0.66rem;
  line-height: 1.45;
  background: var(--cs50-code-bg);
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
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
