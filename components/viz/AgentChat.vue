<script setup lang="ts">
/**
 * AgentChat — one scene of the student–agent conversation (demoScript.ts).
 *
 * Each → reveals the next turn. Agent turns can carry choice cards (hover or
 * focus one for its feasibility), a specification card, or a risk scale.
 * Earlier scenes are summarised in a strip at the top so the conversation
 * reads as one thread across slides.
 */
import { computed, ref } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import { scenes, sceneIndex, type Choice, type Risk } from './demoScript'

const props = defineProps<{ scene: string }>()

const idx = sceneIndex(props.scene)
const scene = scenes[idx]
const earlier = scenes.slice(0, idx)

const { step } = useVizSteps(scene.turns.length)
const visible = computed(() => scene.turns.slice(0, step.value))

/** A turn folds its hover panel once a newer turn with its own cards exists. */
function isOld(ti: number) {
  return visible.value.slice(ti + 1).some((t) => 'choices' in t || 'risks' in t || 'spec' in t)
}

/** Hovered/focused choice, keyed by turn index so only one panel is open. */
const hovered = ref<{ turn: number; choice: Choice } | null>(null)
const hoveredRisk = ref<Risk | null>(null)

const feasLabel: Record<string, string> = { yes: 'feasible', maybe: 'feasible, with a cost', no: 'not an input device' }
</script>

<template>
  <div class="viz chat" :class="{ first: !earlier.length }">
    <div v-if="earlier.length" class="sofar">
      <span class="viz-label">So far</span>
      <span v-for="s in earlier" :key="s.id" class="sofar-item">{{ s.summary }}</span>
    </div>

    <div class="thread">
      <div v-for="(t, ti) in visible" :key="ti" class="turn" :class="[t.who, { old: isOld(ti) }]">
        <div class="who">{{ t.who === 'you' ? 'You' : 'Agent' }}</div>
        <div class="bubble">
          <p>{{ t.text }}</p>

          <!-- specification card -->
          <ul v-if="'spec' in t" class="spec">
            <li v-for="line in t.spec" :key="line">{{ line }}</li>
          </ul>

          <!-- choice cards + hover panel -->
          <template v-if="'choices' in t">
            <div v-if="t.prompt" class="prompt">{{ t.prompt }}</div>
            <div class="choices" @mouseleave="hovered = null">
              <button
                v-for="c in t.choices"
                :key="c.name"
                type="button"
                class="choice"
                :class="[c.feasible, { picked: c.picked && ti < step - 1, lit: hovered?.choice === c }]"
                @mouseenter="hovered = { turn: ti, choice: c }"
                @focus="hovered = { turn: ti, choice: c }"
                @blur="hovered = null"
              >
                <span class="cname">{{ c.name }}</span>
                <span v-if="c.blurb" class="cblurb">{{ c.blurb }}</span>
              </button>
            </div>
            <div class="panel" :class="{ open: hovered?.turn === ti }">
              <template v-if="hovered?.turn === ti">
                <span class="viz-pill" :class="{ ok: hovered.choice.feasible === 'yes', bad: hovered.choice.feasible === 'no' }">{{ feasLabel[hovered.choice.feasible] }}</span>
                <span class="ptext">{{ hovered.choice.detail }}</span>
              </template>
            </div>
          </template>

          <!-- risk scale -->
          <template v-if="'risks' in t">
            <div class="scale" @mouseleave="hoveredRisk = null">
              <div class="axis">
                <span>done it in CS50</span>
                <span class="line" />
                <span class="far">never done it</span>
              </div>
              <div class="dots">
                <button
                  v-for="r in t.risks"
                  :key="r.task"
                  type="button"
                  class="dot"
                  :class="{ far: r.unknown > 0.6, lit: hoveredRisk === r }"
                  :style="{ left: `${r.unknown * 100}%`, top: `${r.lane * 1.3}rem` }"
                  @mouseenter="hoveredRisk = r"
                  @focus="hoveredRisk = r"
                  @blur="hoveredRisk = null"
                >
                  <span class="dot-label">{{ r.task }}</span>
                </button>
              </div>
            </div>
            <div class="panel" :class="{ open: hoveredRisk }">
              <template v-if="hoveredRisk">
                <span class="viz-pill" :class="{ crimson: hoveredRisk.unknown > 0.6 }">{{ hoveredRisk.week }}</span>
                <span class="ptext">{{ hoveredRisk.detail }}</span>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat {
  grid-template-rows: auto 1fr;
  gap: 0.5rem;
}
.chat.first {
  grid-template-rows: 1fr;
}
.sofar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem 0.6rem;
  font-size: 0.74rem;
  color: var(--cs50-muted);
}
.sofar .viz-label {
  margin: 0;
}
.sofar-item {
  padding: 0.1rem 0.55rem;
  border: 1px solid var(--cs50-border);
  border-radius: 999px;
  background: var(--cs50-code-bg);
}
.thread {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.45rem;
  min-height: 0;
  overflow: hidden;
}
.turn {
  display: grid;
  grid-template-columns: 3.2rem 1fr;
  gap: 0.6rem;
  align-items: start;
  animation: rise 300ms ease both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
.who {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--cs50-muted);
  padding-top: 0.6rem;
}
.turn.you .who {
  color: var(--cs50-crimson);
}
.bubble {
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  background: var(--cs50-code-bg);
  border: 1px solid var(--cs50-border);
  font-size: 0.9rem;
  line-height: 1.4;
  min-width: 0;
}
.turn.you .bubble {
  background: rgba(165, 28, 48, 0.06);
  border-color: rgba(165, 28, 48, 0.25);
  font-weight: 700;
}
.bubble p {
  margin: 0;
}
.bubble p + * {
  margin-top: 0.5rem;
}
/* once a newer turn exists, older turns fold their hover panel and captions */
.turn.old .panel,
.turn.old .prompt,
.turn.old .cblurb {
  display: none;
}
.turn.old .choice {
  padding: 0.25rem 0.6rem;
}
.turn.old .bubble {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}

/* specification card */
.spec {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0.8rem;
  background: #fff;
  border: 1px solid var(--cs50-border);
  border-left: 4px solid var(--cs50-crimson);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.88rem;
}
.spec li::before {
  content: '\2013  ';
  color: var(--cs50-crimson);
  font-weight: 700;
}

/* choices */
.prompt {
  font-size: 0.82rem;
  color: var(--cs50-muted);
  margin-top: 0.4rem;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.choice {
  appearance: none;
  font: inherit;
  cursor: default;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  background: #fff;
  color: var(--cs50-body);
  text-align: left;
  transition: all 150ms;
}
.choice:focus-visible {
  outline: 2px solid var(--cs50-body);
  outline-offset: 2px;
}
.cname {
  font-weight: 700;
  font-size: 0.9rem;
}
.cblurb {
  font-size: 0.72rem;
  color: var(--cs50-muted);
}
.choice.lit {
  border-color: var(--cs50-body);
  background: var(--cs50-code-bg);
}
.choice.picked {
  border-color: var(--cs50-crimson);
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.15);
}
.choice.no .cname {
  color: var(--cs50-muted);
}

/* hover panel: reserved height so it never shifts the layout */
.panel {
  margin-top: 0.5rem;
  min-height: 3.6em;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.45rem 0.7rem;
  border-radius: 6px;
  border: 1px dashed var(--cs50-border);
  font-size: 0.84rem;
  line-height: 1.4;
  transition: all 150ms;
}
.panel.open {
  border-style: solid;
  border-color: var(--cs50-body);
  background: #fff;
}
.panel .viz-pill {
  flex: none;
  margin-top: 0.1rem;
}
.ptext {
  min-width: 0;
}

/* risk scale */
.scale {
  padding: 0.6rem 0.4rem 0.2rem;
}
.axis {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cs50-muted);
  font-weight: 700;
}
.axis .line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #198754, #adb5bd 50%, var(--cs50-crimson));
  border-radius: 1px;
}
.axis .far {
  color: var(--cs50-crimson);
}
.dots {
  position: relative;
  height: 5.4rem;
  margin: 0.4rem 1.5rem 0 1rem;
}
.dot {
  appearance: none;
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: 2px solid #198754;
  background: #fff;
  cursor: default;
  padding: 0;
  transition: all 150ms;
}
.dot.far {
  border-color: var(--cs50-crimson);
  background: var(--cs50-crimson);
  width: 1.4rem;
  height: 1.4rem;
  margin-top: -0.15rem;
}
.dot.lit {
  box-shadow: 0 0 0 4px rgba(33, 37, 41, 0.15);
}
.dot:focus-visible {
  outline: 2px solid var(--cs50-body);
  outline-offset: 2px;
}
.dot-label {
  position: absolute;
  left: 1.4rem;
  top: -0.15rem;
  white-space: nowrap;
  font-size: 0.78rem;
  color: var(--cs50-body);
}
.dot.far .dot-label {
  left: auto;
  right: 1.7rem;
  top: 0.05rem;
  font-weight: 700;
  color: var(--cs50-crimson);
}
</style>
