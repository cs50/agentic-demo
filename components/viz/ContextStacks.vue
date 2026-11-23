<script setup lang="ts">
/**
 * ContextStacks — Concept 8, second slide. The same four jobs done two ways,
 * drawn as what each agent has to hold in its head. Left: one agent carries
 * everything, and the stack grows with every job. Right: four agents, each
 * with a short stack. One idea per slide: smaller contexts, fresh eyes.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

interface Job {
  name: string
  /** What this job needs to see. */
  needs: string[]
  /** What it produces, which the single agent then also carries. */
  makes: string
}

const jobs: Job[] = [
  { name: 'Write the plan', needs: ['the request', 'the spec\u2019s "personal touch"', 'index.html'], makes: 'the plan' },
  { name: 'Change the routes', needs: ['the plan', 'app.py', '.schema'], makes: 'new routes' },
  { name: 'Change the template', needs: ['the plan', 'index.html', 'layout.html'], makes: 'new template' },
  { name: 'Run the test plan', needs: ['the "Testing" section', 'the running app', 'a fresh finance.db'], makes: 'test results' },
]

// Steps 1–4: the single agent does job 1..4 and its stack grows.
// Step 5: the four agents appear beside it. Step 6: verdict.
const { step, at } = useVizSteps(jobs.length + 2)
const doneJobs = computed(() => Math.min(step.value, jobs.length))

/** Everything the single agent is carrying after `doneJobs` jobs (deduplicated, in order). */
const soloStack = computed(() => {
  const items: { text: string; job: number; made?: boolean }[] = []
  const seen = new Set<string>()
  for (let j = 0; j < doneJobs.value; j++) {
    for (const n of jobs[j].needs) {
      if (!seen.has(n)) {
        seen.add(n)
        items.push({ text: n, job: j })
      }
    }
    const m = jobs[j].makes
    if (!seen.has(m)) {
      seen.add(m)
      items.push({ text: m, job: j, made: true })
    }
  }
  return items
})

const showTeam = computed(() => at(jobs.length + 1))
const verdict = computed(() => at(jobs.length + 2))
</script>

<template>
  <div class="viz stacks">
    <div class="cols" :class="{ team: showTeam }">
      <section class="viz-card solo">
        <div class="head">
          <span class="viz-label accent">One agent</span>
          <span class="sub">does all four jobs, in order</span>
        </div>
        <div class="jobs">
          <span v-for="(j, i) in jobs" :key="j.name" class="viz-pill" :class="{ crimson: doneJobs === i + 1, ok: doneJobs > i + 1 }">{{ i + 1 }}. {{ j.name }}</span>
        </div>
        <div class="viz-label">Holds in its head</div>
        <ul class="stack" :class="{ heavy: doneJobs >= 3 }">
          <li v-for="it in soloStack" :key="it.text" :class="{ made: it.made, fresh: it.job === doneJobs - 1 }">{{ it.text }}</li>
          <li v-if="!soloStack.length" class="empty">&nbsp;</li>
        </ul>
        <div class="count">
          <b>{{ soloStack.length }}</b> things<span v-if="doneJobs === jobs.length">, four of them its own output. It now tests its own work.</span>
        </div>
      </section>

      <section v-show="showTeam" class="viz-card team-card">
        <div class="head">
          <span class="viz-label accent">Four agents</span>
          <span class="sub">one job each, handed along</span>
        </div>
        <div class="four">
          <div v-for="(j, i) in jobs" :key="j.name" class="mini">
            <div class="mname">{{ i + 1 }}. {{ j.name }}</div>
            <ul class="stack small">
              <li v-for="n in j.needs" :key="n">{{ n }}</li>
            </ul>
            <div class="count small">
              <Tip :text="`Sees only these three. ${i === 3 ? 'Fresh eyes: it did not write the code it is testing.' : 'Everything else is noise to this job.'}`" side="top">
                <b>3</b> things
              </Tip>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="verdict viz-enter" :class="{ shown: verdict }">
      Same model, same four jobs. One agent carries <b>{{ soloStack.length }}</b> things and grades its own homework. Four agents carry <b>3</b> each, and the tester never saw the code being written.
    </div>
  </div>
</template>

<style scoped>
.stacks {
  grid-template-rows: 1fr auto;
  gap: 0.6rem;
}
.cols {
  display: grid;
  grid-template-columns: minmax(0, 34rem);
  justify-content: center;
  gap: 0.8rem;
  min-height: 0;
}
.cols.team {
  grid-template-columns: 1fr 1.6fr;
  justify-content: stretch;
}
.solo,
.team-card {
  padding: 0.7rem 0.9rem;
  overflow: hidden;
}
.team-card {
  animation: rise 320ms ease both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
.head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}
.head .viz-label {
  margin: 0;
}
.sub {
  font-size: 0.78rem;
  color: var(--cs50-muted);
}
.jobs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.6rem;
}
.stack {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-content: flex-start;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.stack li {
  padding: 0.18rem 0.5rem;
  border: 1px solid var(--cs50-border);
  border-radius: 4px;
  background: var(--cs50-code-bg);
  font-size: 0.74rem;
  animation: pop 260ms ease both;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
}
.stack li.made {
  border-style: dashed;
}
.stack li.fresh {
  border-color: var(--cs50-crimson);
  background: rgba(165, 28, 48, 0.06);
}
.stack.heavy li {
  border-color: #f1aeb5;
  background: #fdf1f2;
}
.stack.heavy li.fresh {
  border-color: var(--cs50-crimson);
}
.stack li.empty {
  visibility: hidden;
}
.count {
  margin-top: 0.6rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.84rem;
}
.count b {
  color: var(--cs50-crimson);
  font-size: 1.1rem;
}
.four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}
.mini {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  padding: 0.45rem 0.5rem;
  min-width: 0;
}
.mname {
  font-weight: 700;
  font-size: 0.74rem;
  margin-bottom: 0.4rem;
  line-height: 1.25;
}
.stack.small {
  flex-direction: column;
  flex-wrap: nowrap;
}
.stack.small li {
  font-size: 0.66rem;
  animation: none;
}
.count.small {
  margin-top: auto;
  font-size: 0.74rem;
}
.count.small b {
  color: #198754;
  font-size: 0.95rem;
}
.verdict {
  font-size: 0.88rem;
  text-align: center;
  line-height: 1.45;
}
.verdict b {
  color: var(--cs50-crimson);
}
</style>
