<script setup lang="ts">
/**
 * ControllerTest — the "verify first" diagnostic from the spec, made visual.
 *
 * Left: a DualShock 4 whose buttons and sticks light up and move with the real
 * controller. Right: the duck, acting on the same inputs (left stick or D-pad
 * to walk, Cross to jump), so the audience sees input become action before any
 * game code is trusted. Below: the event log the spec asks for,
 * e.g. `Button 0 (CROSS): DOWN`.
 *
 * Polls the Gamepad API only while this slide is active. The duck preview uses
 * the values the solution physics.ts will use, so what it previews is what the
 * finished game does. (Deliberately not the live physics.ts: this experiment
 * comes before the game in the story and must work whatever that file says.)
 */
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Controller, type ControllerEvent } from '../demo/mario/controller'
import { MOVE_SPEED } from '../demo/mario/engine'
import { GRAVITY, JUMP_VELOCITY } from '../demo/mario/solutions/physics'
import DualShock from './viz/DualShock.vue'
import DuckSprite from './viz/DuckSprite.vue'

const { $renderContext } = useSlideContext()
const isLive = ['slide', 'presenter'].includes($renderContext.value)
const isActive = useIsSlideActive()

const controller = new Controller()
const connected = ref(false)
const gamepadId = ref<string | null>(null)
const mapping = ref('')
const buttons = reactive<boolean[]>(Array(18).fill(false))
const axes = reactive<number[]>([0, 0, 0, 0])
const log = ref<string[]>([])
const MAX_LOG = 3

/** Which inputs the game uses: Cross (0) to jump, D-pad left/right (14/15) and the left stick to move. */
const USED = [0, 14, 15]

// --- duck preview: a strip 0..STAGE_W wide, ground at the bottom -------------
const STAGE_W = 300
const STAGE_H = 112
const DUCK = 48 // rendered size, px
const duck = reactive({ x: (STAGE_W - DUCK) / 2, y: 0, vy: 0, facing: 1 as 1 | -1, onGround: true })
const action = ref<'idle' | 'left' | 'right' | 'jump'>('idle')
const actionLabel: Record<typeof action.value, string> = {
  idle: 'standing still',
  left: '← walking left',
  right: 'walking right →',
  jump: '↑ jump',
}

let raf = 0
let unsubscribe: (() => void) | null = null
let lastT = 0

function push(line: string) {
  log.value = [line, ...log.value].slice(0, MAX_LOG)
}

function onEvent(ev: ControllerEvent) {
  switch (ev.kind) {
    case 'connected':
      connected.value = true
      gamepadId.value = ev.id
      mapping.value = ev.mapping
      push(`Connected: ${ev.id} (mapping: ${ev.mapping})`)
      break
    case 'disconnected':
      connected.value = false
      gamepadId.value = null
      push('Disconnected')
      buttons.fill(false)
      axes.fill(0)
      break
    case 'button':
      buttons[ev.index] = ev.pressed
      push(`Button ${ev.index} (${ev.name}): ${ev.pressed ? 'DOWN' : 'UP'}`)
      break
    case 'axis':
      axes[ev.index] = ev.value
      if (Math.abs(ev.value) > 0.5 || Math.abs(ev.value) < 0.05) push(`Axis ${ev.index} (${ev.name}): ${ev.value.toFixed(2)}`)
      break
  }
}

/** One 60 Hz physics step for the preview duck, using the finished game's constants (scaled to the small stage). */
function stepDuck(state: ReturnType<Controller['poll']>) {
  const k = 0.8 // the stage is smaller than the game canvas
  duck.x = Math.max(0, Math.min(STAGE_W - DUCK, duck.x + state.moveX * MOVE_SPEED * k))
  if (state.moveX !== 0) duck.facing = state.moveX > 0 ? 1 : -1
  if (state.jumpPressed && duck.onGround) {
    duck.vy = JUMP_VELOCITY * k
    duck.onGround = false
  }
  duck.vy += GRAVITY * k
  duck.y = Math.min(0, duck.y + duck.vy) // y is the lift above the ground, ≤ 0
  if (duck.y === 0) {
    duck.vy = 0
    duck.onGround = true
  }
  action.value = !duck.onGround ? 'jump' : state.moveX < 0 ? 'left' : state.moveX > 0 ? 'right' : 'idle'
}

let pendingJump = false

function loop(t: number) {
  const state = controller.poll()
  // jumpPressed is an edge: true for exactly one poll. Latch it so a frame that
  // runs zero physics steps (less than 1/60 s elapsed) doesn't drop the press.
  if (state.jumpPressed) pendingJump = true
  // fixed 60 Hz steps regardless of display refresh
  if (!lastT) lastT = t
  let dt = Math.min(100, t - lastT)
  while (dt >= 1000 / 60) {
    stepDuck({ ...state, jumpPressed: pendingJump })
    pendingJump = false
    dt -= 1000 / 60
    lastT += 1000 / 60
  }
  raf = requestAnimationFrame(loop)
}

function start() {
  if (!isLive || raf) return
  unsubscribe = controller.subscribe(onEvent)
  lastT = 0
  raf = requestAnimationFrame(loop)
}

function stop() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  unsubscribe?.()
  unsubscribe = null
}

onMounted(() => isActive.value && start())
watch(isActive, (active) => (active ? start() : stop()))
onBeforeUnmount(stop)
</script>

<template>
  <div class="ct-root">
    <div class="ct-status" :class="connected ? 'ok' : 'wait'">
      <span class="dot" />
      <span v-if="connected">
        <b>{{ gamepadId }}</b>
        <span class="muted"> · mapping: {{ mapping }}</span>
      </span>
      <span v-else>Waiting for the controller. Press any button on it.</span>
    </div>

    <div class="ct-grid">
      <section class="ct-panel">
        <div class="ct-title">What the browser sees</div>
        <DualShock :buttons="buttons" :axes="axes" :connected="connected" :highlight="USED" />
        <div class="legend">
          <span><i class="sw used" /> used by the game: Cross jumps, left stick or D-pad moves</span>
        </div>
      </section>

      <section class="ct-panel">
        <div class="ct-title">What the duck does</div>
        <div class="stage" :style="{ width: `${STAGE_W}px`, height: `${STAGE_H}px` }">
          <div class="ground" />
          <div class="duck" :style="{ transform: `translate(${duck.x}px, ${duck.y}px)` }">
            <DuckSprite :facing="duck.facing" :size="DUCK" />
          </div>
        </div>
        <div class="action" :class="{ live: action !== 'idle' }">{{ actionLabel[action] }}</div>
      </section>
    </div>

    <section class="ct-panel log">
      <div class="ct-title">event log</div>
      <pre><template v-if="log.length"><div v-for="(l, i) in log" :key="l + i" :class="{ newest: i === 0 }">{{ l }}</div></template><div v-else class="muted">// no events yet</div></pre>
    </section>
  </div>
</template>

<style scoped>
.ct-root {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: #212529;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ct-root :deep(.ds4) {
  max-height: 170px;
  margin: 0 auto;
}
.ct-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.8rem;
  border-radius: 6px;
  background: #fff3cd;
  border: 1px solid #ffe69c;
  color: #664d03;
}
.ct-status.ok {
  background: #d1e7dd;
  border-color: #a3cfbb;
  color: #0a3622;
}
.ct-status .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffc107;
}
.ct-status.ok .dot {
  background: #198754;
}
.muted {
  color: #6c757d;
}
.ct-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 0.6rem;
}
.ct-panel {
  min-width: 0;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  display: flex;
  flex-direction: column;
}
.ct-title {
  color: #a51c30;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.65rem;
  margin-bottom: 0.4rem;
}
.legend {
  margin-top: 0.3rem;
  font-family: 'PT Sans', sans-serif;
  font-size: 0.72rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.sw {
  display: inline-block;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  border: 1.5px dashed #a51c30;
  vertical-align: middle;
  margin-right: 0.3rem;
}
.stage {
  position: relative;
  margin: 0 auto;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
  background-image: linear-gradient(rgba(33, 37, 41, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(33, 37, 41, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}
.ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 14px;
  background: #e9ecef;
  border-top: 2px solid #adb5bd;
}
.duck {
  position: absolute;
  left: 0;
  bottom: 14px;
  line-height: 0;
  will-change: transform;
  /* Shared with the landing target in MarioGame: on the way to the next slide,
     the browser morphs this duck into the one standing in the game. */
  view-transition-name: duck;
}
.action {
  margin-top: 0.4rem;
  text-align: center;
  font-family: 'PT Sans', sans-serif;
  font-size: 0.9rem;
  color: #6c757d;
  transition: color 120ms;
}
.action.live {
  color: #a51c30;
  font-weight: 700;
}
.log pre {
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  line-height: 1.45;
  min-height: 4.4em;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
  font-size: 0.72rem;
}
.log .newest {
  color: #a51c30;
  font-weight: 700;
}
</style>
