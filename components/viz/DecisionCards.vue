<script setup lang="ts">
/**
 * DecisionCards — the design decisions behind the demo, one at a time.
 *
 * Each decision takes two presses: the first shows the question and the
 * options (ask the room), the second reveals our pick, why, and what each
 * other option would have cost. The left rail shows where we are.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'

interface Option {
  name: string
  detail: string
  /** Shown after the reveal, for the options not chosen. */
  tradeoff: string
}

interface Decision {
  question: string
  concept: string
  options: Option[]
  pick: number
  why: string
}

const decisions: Decision[] = [
  {
    question: 'Where does the game run?',
    concept: 'Design',
    options: [
      { name: 'In the browser', detail: 'Canvas for drawing, the Gamepad API for the controller', tradeoff: '' },
      { name: 'Python', detail: 'pygame for drawing and pygame.joystick for the controller', tradeoff: 'A second window and a second runtime to switch to on stage; no live reload.' },
      { name: 'A game engine', detail: 'Unity, Unreal, or Godot', tradeoff: 'Days of setup for an 8-block pyramid. Physics we do not need; a build step between every change.' },
    ],
    pick: 0,
    why: 'The slides are already a web page, so the game can live inside them. The browser reads the DualShock 4 with no drivers, and a saved file reloads the level while the duck keeps running.',
  },
  {
    question: 'One file or several?',
    concept: 'Design',
    options: [
      { name: 'One script', detail: 'Input, physics, drawing and the level in one file', tradeoff: 'What the vague prompt produced. Nothing can be tested or swapped alone, and the agent must hold all of it in its head.' },
      { name: 'Modules by job', detail: 'controller.ts, engine.ts, level.ts', tradeoff: '' },
      { name: 'A framework', detail: 'Phaser or similar, with its own scene and input systems', tradeoff: 'Another layer to learn and explain; the lecture is about the boundaries, not the framework.' },
    ],
    pick: 1,
    why: 'Each module knows one thing. The controller module knows nothing about the duck; the engine knows nothing about the DualShock. Each can be verified alone, and the agent edits level.ts without touching anything else.',
  },
  {
    question: 'What do we verify first?',
    concept: 'Verification',
    options: [
      { name: 'Play the game', detail: 'Build everything, then see if it works', tradeoff: 'If a button does nothing, is it the controller, the browser, the mapping, or the physics? Four suspects.' },
      { name: 'Unit tests for physics', detail: 'Gravity, jump, collision', tradeoff: 'Useful later, but the physics is not the risk. The hardware is.' },
      { name: 'A controller diagnostic', detail: 'test_controller: print every button and stick event', tradeoff: '' },
    ],
    pick: 2,
    why: 'The riskiest unknown is the hardware: does the browser see the DualShock, and which number is Cross? That is cheap to check and expensive to guess. Verify it before trusting any game code.',
  },
  {
    question: 'How is the level described?',
    concept: 'Specification',
    options: [
      { name: 'Coordinates', detail: 'A list of (x, y) blocks', tradeoff: 'Unreadable on a slide, and nothing to do with Week 1.' },
      { name: 'A level editor file', detail: 'JSON or Tiled, loaded at start', tradeoff: 'Another tool and another format for a pyramid you can describe in two loops.' },
      { name: 'The Week 1 loop', detail: 'level.ts: strings of #, one per row, from a loop', tradeoff: '' },
    ],
    pick: 2,
    why: 'It is mario.c in TypeScript. Students read it at a glance, the agent edits it live, and the pyramid is a specification: so many rows, so many hashes.',
  },
]

const { step } = useVizSteps(decisions.length * 2)
const current = computed(() => Math.min(decisions.length - 1, Math.max(0, Math.ceil(step.value / 2) - 1)))
const revealed = computed(() => step.value > 0 && step.value % 2 === 0)
const started = computed(() => step.value > 0)
const d = computed(() => decisions[current.value])
</script>

<template>
  <div class="viz decisions">
    <aside class="rail">
      <div class="viz-label">Decisions</div>
      <ol>
        <li
          v-for="(dec, i) in decisions"
          :key="dec.question"
          :class="{ now: started && i === current, done: started && (i < current || (i === current && revealed)) }"
        >
          <span class="n">{{ i + 1 }}</span>
          <span class="q">{{ dec.question }}</span>
          <span class="pick" v-if="started && (i < current || (i === current && revealed))">{{ dec.options[dec.pick].name }}</span>
        </li>
      </ol>
    </aside>

    <section class="main">
      <template v-if="started">
        <div class="head">
          <span class="viz-pill crimson">{{ d.concept }}</span>
          <h2>{{ d.question }}</h2>
          <span class="cue" v-if="!revealed">What would you choose?</span>
        </div>
        <div class="options" :class="{ revealed }">
          <div v-for="(o, i) in d.options" :key="o.name" class="opt" :class="{ chosen: revealed && i === d.pick, passed: revealed && i !== d.pick }">
            <div class="oname">
              {{ o.name }}
              <span v-if="revealed && i === d.pick" class="viz-pill ok">our pick</span>
            </div>
            <div class="odetail">{{ o.detail }}</div>
            <div v-if="revealed && i !== d.pick" class="otrade">{{ o.tradeoff }}</div>
          </div>
        </div>
        <div class="why viz-enter" :class="{ shown: revealed }">
          <span class="viz-label accent">Why</span>
          <p>{{ d.why }}</p>
        </div>
      </template>
      <div v-else class="intro">
        <p>Before a line of code: four decisions. For each, the options first. Think about which you would pick, and why.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.decisions {
  grid-template-columns: 15rem 1fr;
  gap: 1rem;
}
.rail ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.rail li {
  display: grid;
  grid-template-columns: 1.4rem 1fr;
  gap: 0.4rem 0.5rem;
  align-items: start;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  font-size: 0.84rem;
  opacity: 0.55;
  transition: all 250ms;
}
.rail li.now {
  opacity: 1;
  border-color: var(--cs50-crimson);
  background: rgba(165, 28, 48, 0.05);
}
.rail li.done {
  opacity: 1;
}
.rail .n {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: var(--cs50-rule);
  color: var(--cs50-muted);
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 700;
}
.rail li.now .n {
  background: var(--cs50-crimson);
  color: #fff;
}
.rail li.done .n {
  background: #198754;
  color: #fff;
}
.rail .q {
  font-weight: 700;
  line-height: 1.25;
}
.rail .pick {
  grid-column: 2;
  font-size: 0.74rem;
  color: #198754;
  font-weight: 700;
}
.main {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.7rem;
}
.head h2 {
  margin: 0;
  font-size: 1.35rem;
  color: var(--cs50-body);
}
.cue {
  margin-left: auto;
  font-size: 0.88rem;
  color: var(--cs50-crimson);
  font-weight: 700;
}
.options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  flex: 1;
  min-height: 0;
  margin-bottom: 0.8rem;
}
.opt {
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #fff;
  transition: all 300ms;
  animation: rise 300ms ease both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
.oname {
  font-weight: 700;
  font-size: 1.12rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}
.odetail {
  font-size: 0.92rem;
  color: var(--cs50-muted);
  line-height: 1.4;
}
.otrade {
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 1px dashed var(--cs50-rule);
  font-size: 0.9rem;
  color: var(--cs50-body);
  line-height: 1.4;
}
.opt.chosen {
  border-color: var(--cs50-crimson);
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.15);
}
.opt.passed {
  background: var(--cs50-code-bg);
}
.opt.passed .oname {
  color: var(--cs50-muted);
}
.why {
  margin-top: 0;
  padding: 0.7rem 0.9rem;
  border-left: 4px solid var(--cs50-crimson);
  background: rgba(165, 28, 48, 0.05);
  border-radius: 6px;
}
.why .viz-label {
  margin-bottom: 0.2rem;
}
.why p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
}
.intro {
  margin: auto 0;
  padding: 1.2rem;
  text-align: center;
  color: var(--cs50-muted);
  font-size: 1.05rem;
  line-height: 1.5;
}
.intro p {
  margin: 0;
}
</style>
