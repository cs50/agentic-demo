<script setup lang="ts">
/**
 * DecisionCards — the design decisions behind the demo, one at a time.
 *
 * Each decision takes two presses: the first shows the question and the
 * options (ask the room), the second reveals our pick and why. Hovering or
 * focusing an option, at any point, opens a panel with its feasibility and
 * trade-offs; after the reveal the panel also carries our verdict on it.
 * The left rail shows where we are.
 */
import { computed, ref } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'

interface Option {
  name: string
  detail: string
  feasibility: string
  tradeoffs: string
  /** Our view of this option, shown only after the reveal. */
  verdict: string
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
    question: 'Which language, and which framework?',
    concept: 'Design',
    options: [
      {
        name: 'TypeScript',
        detail: 'A Vue component; Canvas for drawing; the Gamepad API for the controller',
        feasibility: 'Native to the browser. Canvas, requestAnimationFrame and the Gamepad API are all JavaScript APIs, and Vite reloads a saved file in place.',
        tradeoffs: 'A language most of the room has seen for one week (Week 8). No pygame, no SDL; we draw the pyramid ourselves.',
        verdict: 'Our pick. The deck is already a Vue app, so the game is a component inside it, and the controller needs no bridge.',
      },
      {
        name: 'Python',
        detail: 'pygame, or Python in the browser via Pyodide',
        feasibility: 'pygame cannot run in a browser. Pyodide runs CPython compiled to WebAssembly, but has no controller access of its own: Python would call the browser\u2019s Gamepad API through a JavaScript bridge, every frame.',
        tradeoffs: 'The language of Weeks 6 to 9, but a 10 MB runtime to download, slower frames, and the controller code ends up in JavaScript anyway.',
        verdict: 'Not chosen. Possible, but the hard part (the controller) would still be JavaScript, with Python wrapped around it.',
      },
      {
        name: 'C',
        detail: 'SDL2, compiled to WebAssembly with Emscripten',
        feasibility: 'A real option. Emscripten maps SDL2 onto Canvas and WebGL, and SDL\u2019s joystick API onto the browser\u2019s Gamepad API. Week 1\u2019s language, running in a tab.',
        tradeoffs: 'A compiler toolchain and a build step between every edit. No live reload of the level while the duck keeps running. Manual memory management, for a pyramid.',
        verdict: 'Not chosen. A fine project, but every change needs a rebuild, and the live-editing demo depends on not rebuilding.',
      },
    ],
    pick: 0,
    why: 'The browser speaks JavaScript. The controller, the drawing and the reload all come for free, and the game can live inside the slides.',
  },
  {
    question: 'One file or several?',
    concept: 'Design',
    options: [
      {
        name: 'One script',
        detail: 'Input, physics, drawing and the level in one file',
        feasibility: 'Works. It is what the first prompt produced.',
        tradeoffs: 'Nothing can be tested or swapped alone. A controller bug and a physics bug live in the same two hundred lines, and the agent must hold all of it in its head to change any of it.',
        verdict: 'Not chosen. It is the shape of the naive attempt.',
      },
      {
        name: 'Modules by job',
        detail: 'controller.ts, engine.ts, level.ts',
        feasibility: 'Three small files, one job each. The controller module knows nothing about the duck; the engine knows nothing about the DualShock.',
        tradeoffs: 'A little more plumbing: the engine is handed a world and a controller instead of making its own.',
        verdict: 'Our pick. Each part can be verified alone, and the agent edits level.ts without touching anything else.',
      },
      {
        name: 'A game framework',
        detail: 'Phaser or similar, with its own scenes, physics and input',
        feasibility: 'Phaser gives sprites, physics, scenes and a gamepad plugin out of the box.',
        tradeoffs: 'Another layer to learn and explain, and its plugins would do the interesting parts (input, collision) for us, off stage.',
        verdict: 'Not chosen. The framework would hide exactly the boundaries this lecture is about.',
      },
    ],
    pick: 1,
    why: 'Each module knows one thing, so each can be verified alone, and the one file the agent edits live touches nothing else.',
  },
  {
    question: 'What do we verify first?',
    concept: 'Verification',
    options: [
      {
        name: 'Play the game',
        detail: 'Build everything, then see if it works',
        feasibility: 'Easy. Build it all, pick up the controller, press buttons.',
        tradeoffs: 'When a button does nothing, there are four suspects: the controller, the browser, the mapping, the physics.',
        verdict: 'Not chosen. It tests everything at once, so it says nothing about which part failed.',
      },
      {
        name: 'Unit tests for physics',
        detail: 'Gravity, jump height, collision',
        feasibility: 'Straightforward. The physics is pure functions of numbers.',
        tradeoffs: 'The physics is the part we understand best. The hardware is the part we understand least.',
        verdict: 'Not first. Worth having later; it checks the wrong risk tonight.',
      },
      {
        name: 'A controller diagnostic',
        detail: 'test_controller: print every button and stick event',
        feasibility: 'Thirty lines that print what the browser sees.',
        tradeoffs: 'Proves nothing about the game itself. It is a check on the world outside our code.',
        verdict: 'Our pick. The riskiest unknown is the hardware, and this answers it in a minute: does the browser see the DualShock, and which number is Cross?',
      },
    ],
    pick: 2,
    why: 'Verify the thing you understand least, and verify it before you build on it. The controller is cheap to check and expensive to guess.',
  },
  {
    question: 'How is the level described?',
    concept: 'Specification',
    options: [
      {
        name: 'Coordinates',
        detail: 'A list of (x, y) blocks',
        feasibility: 'Trivial to load.',
        tradeoffs: 'Unreadable on a slide, and editing it live means editing numbers. Nothing to do with Week 1.',
        verdict: 'Not chosen.',
      },
      {
        name: 'A level editor file',
        detail: 'Tiled or JSON, loaded at start',
        feasibility: 'The right tool for a game with twenty levels.',
        tradeoffs: 'Another tool and another format, for one pyramid you can describe in two loops.',
        verdict: 'Not chosen. Right for a real game, wrong for a demo with one level.',
      },
      {
        name: 'The Week 1 loop',
        detail: 'level.ts: strings of #, one per row, from a loop',
        feasibility: 'mario.c in TypeScript, returning rows of characters.',
        tradeoffs: 'Only shapes a loop can describe. Fine; that is the point.',
        verdict: 'Our pick. Students read it at a glance, the agent edits it live, and the pyramid is itself a specification: so many rows, so many hashes.',
      },
    ],
    pick: 2,
    why: 'It is mario.c in TypeScript. Readable, editable live, and a specification in its own right.',
  },
]

const { step } = useVizSteps(decisions.length * 2)
const current = computed(() => Math.min(decisions.length - 1, Math.max(0, Math.ceil(step.value / 2) - 1)))
const revealed = computed(() => step.value > 0 && step.value % 2 === 0)
const started = computed(() => step.value > 0)
const d = computed(() => decisions[current.value])

/** Option under the pointer or keyboard focus, if any. */
const hovered = ref<number | null>(null)
const inspected = computed(() => (hovered.value == null ? null : d.value.options[hovered.value]))
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
        </div>

        <div class="options" :class="{ revealed }" @mouseleave="hovered = null">
          <button
            v-for="(o, i) in d.options"
            :key="o.name"
            type="button"
            class="opt"
            :class="{ chosen: revealed && i === d.pick, passed: revealed && i !== d.pick, lit: hovered === i }"
            @mouseenter="hovered = i"
            @focus="hovered = i"
            @blur="hovered = null"
          >
            <span class="oname">
              {{ o.name }}
              <span v-if="revealed && i === d.pick" class="viz-pill ok">our pick</span>
            </span>
            <span class="odetail">{{ o.detail }}</span>
          </button>
        </div>

        <div class="panel" :class="{ inspecting: inspected, revealed }">
          <template v-if="inspected">
            <div class="col">
              <span class="viz-label">Feasible?</span>
              <p>{{ inspected.feasibility }}</p>
            </div>
            <div class="col">
              <span class="viz-label">Trade-offs</span>
              <p>{{ inspected.tradeoffs }}</p>
            </div>
            <div class="col verdict" v-if="revealed">
              <span class="viz-label accent">Our verdict</span>
              <p>{{ inspected.verdict }}</p>
            </div>
          </template>
          <template v-else-if="revealed">
            <div class="col why">
              <span class="viz-label accent">Why {{ d.options[d.pick].name }}</span>
              <p>{{ d.why }}</p>
            </div>
          </template>
          <template v-else>
            <div class="col think">
              <p>Three options. Which would you choose, and why? Hover one to see what it would take.</p>
            </div>
          </template>
        </div>
      </template>
      <div v-else class="intro">
        <p>The first prompt left four decisions to the model. Here they are, one at a time: the options first, then what we chose and why.</p>
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
.options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}
.opt {
  appearance: none;
  font: inherit;
  text-align: left;
  color: var(--cs50-body);
  cursor: default;
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: #fff;
  transition: all 200ms;
  animation: rise 300ms ease both;
}
.opt:focus-visible {
  outline: 2px solid var(--cs50-body);
  outline-offset: 2px;
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
  font-size: 0.88rem;
  color: var(--cs50-muted);
  line-height: 1.4;
}
.opt.lit {
  border-color: var(--cs50-body);
  background: var(--cs50-code-bg);
}
.opt.chosen {
  border-color: var(--cs50-crimson);
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.15);
}
.opt.chosen.lit {
  background: rgba(165, 28, 48, 0.05);
}
.opt.passed .oname {
  color: var(--cs50-muted);
}

/* Detail panel: fills the rest of the slide, so hovering never shifts the layout */
.panel {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  background: #fff;
  transition: border-color 200ms, background-color 200ms;
}
.panel.inspecting {
  border-color: var(--cs50-body);
  background: var(--cs50-code-bg);
}
.panel.inspecting.revealed {
  grid-template-columns: 1fr 1fr 1.2fr;
}
.panel:not(.inspecting) {
  grid-template-columns: 1fr;
  border-left: 4px solid var(--cs50-crimson);
}
.panel:not(.inspecting):not(.revealed) {
  border-left-color: var(--cs50-border);
}
.col {
  min-width: 0;
}
.col .viz-label {
  margin-bottom: 0.25rem;
}
.col p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}
.col.verdict {
  border-left: 1px solid var(--cs50-border);
  padding-left: 1rem;
}
.col.verdict p {
  font-weight: 700;
}
.col.why p {
  font-size: 1.1rem;
}
.col.think p {
  color: var(--cs50-muted);
  font-size: 1.05rem;
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
