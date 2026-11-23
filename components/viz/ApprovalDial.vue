<script setup lang="ts">
/**
 * ApprovalDial — Concept 10. Five changes, sorted by what they can break,
 * and a gate you move along the list. Above the gate: the machine proceeds.
 * Below: a person signs off. Three positions: everything waits, the sensible
 * middle, and the dark factory.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import { hint } from './config'
import Tip from './Tip.vue'

const changes = [
  { what: 'Restyle layout.html', risk: 'Worst case: an ugly navbar for an hour.', level: 0 },
  { what: 'Fix a typo in apology.html', risk: 'Worst case: a different typo.', level: 0 },
  { what: 'Change how passwords are hashed', risk: 'Every existing user locked out, or every password exposed.', level: 2 },
  { what: 'Change what session stores', risk: 'Users see each other\u2019s portfolios.', level: 2 },
  { what: 'Change UPDATE users SET cash in buy and sell', risk: 'Money appears or disappears. Silently.', level: 2 },
]

/** Gate position per step: index of the first change that needs a person. */
const positions = [
  { gate: 0, name: 'Everything waits', note: 'Safe. Nothing ships until you have read a CSS diff, so you are the bottleneck.' },
  { gate: 2, name: 'The gate where it belongs', note: 'Low-stakes changes go through on their own. Anything touching passwords, sessions or money waits for a human to read the diff.' },
  { gate: 5, name: 'Dark factory', note: 'Lights out. At 3 a.m. the pipeline deploys a change to how balances are deducted because the tests passed. The agent wrote the tests.' },
]

const { step, at } = useVizSteps(positions.length)
const pos = computed(() => positions[Math.max(0, Math.min(step.value, positions.length) - 1)])
const started = computed(() => at(1))

function auto(i: number) {
  return started.value && i < pos.value.gate
}
</script>

<template>
  <div class="viz dial">
    <section class="viz-card list">
      <div class="viz-label">Changes the factory wants to ship</div>
      <ol>
        <template v-for="(c, i) in changes" :key="c.what">
          <li v-if="started && i === pos.gate" class="gate" :class="{ dark: pos.gate === changes.length }">
            <span class="bar" /><span class="tag">a person signs off below this line</span><span class="bar" />
          </li>
          <li class="change" :class="{ auto: auto(i), gated: started && !auto(i), high: c.level === 2 }">
            <Tip :text="c.risk" side="bottom">
              <span class="what">{{ c.what }}</span>
            </Tip>
            <span class="viz-pill" :class="auto(i) ? (c.level === 2 ? 'bad' : 'ok') : ''">
              {{ !started ? '' : auto(i) ? 'ships on its own' : 'waits for you' }}
            </span>
          </li>
        </template>
        <li v-if="started && pos.gate === changes.length" class="gate dark">
          <span class="bar" /><span class="tag">nobody signs off anything</span><span class="bar" />
        </li>
      </ol>
    </section>

    <section class="viz-card side">
      <div class="viz-label">Where is the gate?</div>
      <div class="positions">
        <div v-for="(p, i) in positions" :key="p.name" class="pos" :class="{ on: started && pos === p, past: at(i + 1) }">
          <span class="idx">{{ i + 1 }}</span>
          <span>{{ p.name }}</span>
        </div>
      </div>
      <p class="note" :class="{ bad: started && pos.gate === changes.length }">
        {{ started ? pos.note : hint('Press → to place the gate.') }}
      </p>
      <div class="verdict viz-enter" :class="{ shown: at(positions.length) }">
        Autonomy is a dial, not a switch. Where it's set is a design decision, and <b>someone owns it</b>.
      </div>
    </section>
  </div>
</template>

<style scoped>
.dial {
  grid-template-columns: 1.5fr 1fr;
}
ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.change {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  font-size: 0.86rem;
  transition: all 300ms;
}
.change.high .what {
  font-weight: 700;
}
.change.auto {
  background: var(--cs50-code-bg);
}
.change.auto.high {
  background: #f8d7da;
  border-color: #f1aeb5;
}
.change.gated {
  border-style: dashed;
}
.gate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.15rem 0;
  animation: slide 300ms ease both;
}
@keyframes slide {
  from {
    opacity: 0;
    transform: scaleX(0.6);
  }
}
.gate .bar {
  flex: 1;
  height: 3px;
  background: var(--cs50-crimson);
  border-radius: 2px;
}
.gate .tag {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cs50-crimson);
  font-weight: 700;
  white-space: nowrap;
}
.gate.dark .bar {
  background: #212529;
}
.gate.dark .tag {
  color: #212529;
}
.positions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.8rem;
}
.pos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  font-size: 0.84rem;
  opacity: 0.45;
  transition: all 250ms;
}
.pos.past {
  opacity: 1;
}
.pos.on {
  border-color: var(--cs50-crimson);
  background: rgba(165, 28, 48, 0.06);
  font-weight: 700;
}
.idx {
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 50%;
  background: var(--cs50-rule);
  color: var(--cs50-muted);
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
}
.pos.on .idx {
  background: var(--cs50-crimson);
  color: #fff;
}
.note {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.45;
  min-height: 5em;
}
.note.bad {
  color: #58151c;
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
