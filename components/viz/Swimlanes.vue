<script setup lang="ts">
/**
 * Swimlanes — Concept 8. The "trade from index" personal touch handed from
 * agent to agent, each with its own small context. Last step: the same job as
 * one agent with everything in its head.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

interface Agent {
  name: string
  job: string
  context: string[]
  output: string
}

const agents: Agent[] = [
  {
    name: 'Spec agent',
    job: 'Reads the request, writes down what changes.',
    context: ['the feature request', 'the Finance spec, "personal touch"', 'index.html as it is'],
    output: 'A form per row in index, posting to /buy and /sell with the symbol filled in.',
  },
  {
    name: 'Backend agent',
    job: 'Changes the routes.',
    context: ['the spec agent\u2019s note', 'app.py', '.schema'],
    output: '/buy and /sell accept a pre-filled symbol; validation unchanged.',
  },
  {
    name: 'Frontend agent',
    job: 'Changes the template.',
    context: ['the spec agent\u2019s note', 'index.html', 'layout.html'],
    output: 'Two small forms per row; no symbol to type.',
  },
  {
    name: 'QA agent',
    job: 'Runs the spec\u2019s test plan.',
    context: ['the "Testing" section', 'the running app', 'a fresh finance.db'],
    output: 'Letters, zero, negatives, decimals, too many shares: all apologies. check50 passes.',
  },
]

const { step, at } = useVizSteps(agents.length + 1)
const active = computed(() => Math.min(step.value, agents.length))
const contrast = computed(() => at(agents.length + 1))

const everything = [...new Set(agents.flatMap((a) => a.context))]
</script>

<template>
  <div class="viz lanes">
    <div class="request">
      <span class="viz-pill crimson">Feature</span>
      <span>Let users buy more shares, or sell shares they own, from <span class="viz-mono">index</span> itself, without typing a symbol.</span>
    </div>

    <div class="grid" :class="{ contrast }">
      <section v-for="(a, i) in agents" :key="a.name" class="lane viz-card" :class="{ done: active > i, now: active === i + 1 && !contrast, idle: active <= i }">
        <div class="head">
          <span class="n">{{ i + 1 }}</span>
          <div>
            <div class="name">{{ a.name }}</div>
            <div class="job">{{ a.job }}</div>
          </div>
        </div>
        <div class="viz-label">Sees</div>
        <ul class="ctx">
          <li v-for="c in a.context" :key="c">{{ c }}</li>
        </ul>
        <div class="out viz-enter" :class="{ shown: active > i }">
          <div class="viz-label">Hands off</div>
          <p>{{ a.output }}</p>
        </div>
        <span v-if="i < agents.length - 1" class="handoff" :class="{ shown: active > i }">→</span>
      </section>

      <section class="mono viz-card viz-enter" :class="{ shown: contrast }">
        <div class="head">
          <span class="n">1</span>
          <div>
            <div class="name">One agent</div>
            <div class="job">Does all four jobs.</div>
          </div>
        </div>
        <div class="viz-label">Sees</div>
        <ul class="ctx big">
          <li v-for="c in everything" :key="c">{{ c }}</li>
          <li>…everything it wrote</li>
        </ul>
        <Tip text="Longer context: more to attend to, more to confuse, and the QA step is biased by having written the code." side="top">
          <p class="warn">Same model. Four times the context, no fresh eyes for testing.</p>
        </Tip>
      </section>
    </div>

    <div class="verdict viz-enter" :class="{ shown: contrast }">
      Four small contexts beat one large one, for the same reason four functions beat one. <b>You</b> decided where to cut.
    </div>
  </div>
</template>

<style scoped>
.lanes {
  grid-template-rows: auto 1fr auto;
  gap: 0.6rem;
}
.request {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.88rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
  min-height: 0;
  position: relative;
  transition: grid-template-columns 400ms;
}
.grid.contrast {
  grid-template-columns: repeat(4, 1fr) 1.3fr;
}
.lane {
  position: relative;
  padding: 0.6rem 0.7rem;
  transition: all 300ms;
}
.lane.idle {
  opacity: 0.45;
}
.lane.now {
  border-color: var(--cs50-crimson);
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.15);
}
.head {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}
.n {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: var(--cs50-body);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex: none;
}
.lane.done .n {
  background: #198754;
}
.lane.now .n {
  background: var(--cs50-crimson);
}
.name {
  font-weight: 700;
  font-size: 0.86rem;
}
.job {
  font-size: 0.7rem;
  color: var(--cs50-muted);
  line-height: 1.3;
}
.ctx {
  list-style: none;
  margin: 0 0 0.5rem;
  padding: 0;
  font-size: 0.72rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.ctx li {
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--cs50-border);
  border-radius: 4px;
  background: var(--cs50-code-bg);
}
.ctx.big {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.2rem;
  font-size: 0.62rem;
}
.ctx.big li {
  border-color: #f1aeb5;
  background: #fdf1f2;
  padding: 0.08rem 0.3rem;
}
.lane,
.mono {
  min-height: 0;
  overflow: hidden;
}
.out {
  margin-top: auto;
}
.out p {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.35;
}
.handoff {
  position: absolute;
  right: -0.72rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--cs50-muted);
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 300ms;
  z-index: 2;
}
.handoff.shown {
  opacity: 1;
  color: var(--cs50-crimson);
}
.mono {
  display: none;
  border-color: #f1aeb5;
  padding: 0.6rem 0.7rem;
}
.grid.contrast .mono {
  display: flex;
}
.mono .n {
  background: #dc3545;
}
.warn {
  margin: auto 0 0;
  font-size: 0.76rem;
  color: #58151c;
  font-weight: 700;
  line-height: 1.35;
}
.verdict {
  font-size: 0.86rem;
  text-align: center;
}
.verdict b {
  color: var(--cs50-crimson);
}
</style>
