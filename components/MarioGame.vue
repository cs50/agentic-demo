<script setup lang="ts">
/**
 * MarioGame — embeds the canvas game in a slide.
 *
 * - Runs only while its slide is active in the main/presenter view, never in
 *   the overview grid or the "next slide" preview.
 * - Subscribes to liveLevel.ts and livePhysics.ts: when level.ts or physics.ts
 *   is saved, the running engine is handed the new world or physics, no remount.
 * - When the duck leaves the level (nothing pulls it down until physics.ts says
 *   so), shows what happened and lets the engine put it back.
 */
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DUCK_COLS, DUCK_ROWS_N } from '../demo/mario/duck'
import { Engine, FPS, type EngineStats } from '../demo/mario/engine'
import { COLS, ROWS, TILE, buildWorld } from '../demo/mario/world'
import DuckSprite from './viz/DuckSprite.vue'
import { currentLevel, levelReady, onLevelChange } from '../demo/mario/liveLevel'
import { currentPhysics, onPhysicsChange, physicsReady } from '../demo/mario/livePhysics'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { $renderContext } = useSlideContext()
const isLive = ['slide', 'presenter'].includes($renderContext.value)
const isActive = useIsSlideActive()

const canvas = ref<HTMLCanvasElement | null>(null)
const stats = ref<EngineStats | null>(null)
const focused = ref(false)
const levelError = ref<string | null>(currentLevel().error)
const physicsError = ref<string | null>(currentPhysics().error)
const flash = ref(false)

const OUCH: Record<string, string[]> = {
  top: [
    'Ouch. The duck flew out of the level.',
    'A jump gave it an upward speed, and nothing ever took it away.',
  ],
  bottom: ['Ouch. The duck fell out of the level.', 'There was nothing under it.'],
}
const ouch = computed(() => (stats.value?.hurt ? OUCH[stats.value.hurt.where] : null))

let engine: Engine | null = null
let unsubscribes: (() => void)[] = []
let flashTimer = 0

/**
 * The landing target for the slide transition. The previous slide's duck has
 * `view-transition-name: duck`; so does this SVG, placed exactly where the
 * engine spawns the duck, so the browser morphs one into the other. It stays
 * for the length of the transition and the landing squash (see styles/index.css)
 * with the canvas duck hidden underneath, then hands over. Removing it earlier
 * would cut the transition short, so LANDING_MS must outlast both.
 */
const LANDING_MS = 1400
const landing = ref(false)
let landingTimer = 0
const spawn = (() => {
  const { x } = buildWorld([]).spawn
  // The spawn point is two rows above the ground; the engine settles the duck
  // onto the ground, so the target sits there too.
  const feetY = (ROWS - 1) * TILE
  const h = DUCK_ROWS_N * 2
  const w = DUCK_COLS * 2
  return {
    left: `${(x / (COLS * TILE)) * 100}%`,
    top: `${((feetY - h) / (ROWS * TILE)) * 100}%`,
    width: `${(w / (COLS * TILE)) * 100}%`,
    height: `${(h / (ROWS * TILE)) * 100}%`,
  }
})()

function flashFrame() {
  flash.value = true
  clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => (flash.value = false), 600)
}

let startToken = 0

async function start() {
  if (!isLive || !canvas.value) return
  stop()
  // Wait for level.ts to load (it's imported dynamically so a broken file can't
  // take the slide down). Bail if the slide was left while we waited.
  const token = ++startToken
  await Promise.all([levelReady, physicsReady])
  if (token !== startToken || !canvas.value) return
  // We were unsubscribed while inactive, so resync both values and error state.
  const level = currentLevel()
  const physics = currentPhysics()
  levelError.value = level.error
  physicsError.value = physics.error
  engine = new Engine(level.value, physics.value)
  // Arriving by slide transition: the SVG target stands in for the duck until it lands.
  landing.value = true
  engine.hidePlayer = true
  clearTimeout(landingTimer)
  landingTimer = window.setTimeout(landed, LANDING_MS)
  engine.start(canvas.value, (s) => {
    stats.value = s
    // The presenter is already playing: hand over now rather than hold a stand-in.
    if (landing.value && (s.controller.moveX !== 0 || s.controller.jumpPressed)) landed()
  })
  unsubscribes = [
    onLevelChange((update) => {
      levelError.value = update.error
      if (update.error || !engine) return
      engine.setWorld(update.value)
      flashFrame()
    }),
    onPhysicsChange((update) => {
      physicsError.value = update.error
      if (update.error || !engine) return
      engine.setPhysics(update.value)
      flashFrame()
    }),
  ]
  // Expose for on-stage diagnostics (e.g. from DevTools): window.__mario.playerState
  if (import.meta.env.DEV) (window as any).__mario = engine
}

function landed() {
  clearTimeout(landingTimer)
  landing.value = false
  if (engine) engine.hidePlayer = false
}

function stop() {
  startToken++ // cancel any start() still awaiting the live modules
  for (const off of unsubscribes) off()
  unsubscribes = []
  engine?.stop()
  engine = null
  clearTimeout(landingTimer)
  landing.value = false
  if (import.meta.env.DEV) delete (window as any).__mario
}

function focusCanvas() {
  canvas.value?.focus()
}

// Start/stop with slide visibility. onMounted covers initial mount and HMR
// remounts (where onSlideEnter would not re-fire); the watch covers navigation.
onMounted(() => isActive.value && start())
watch(isActive, (active) => (active ? start() : stop()))
onBeforeUnmount(stop)
</script>

<template>
  <div class="mg-root" :class="{ compact }">
    <div class="mg-frame" :class="{ focused, flash, broken: !!levelError || !!physicsError }">
      <canvas
        ref="canvas"
        tabindex="0"
        class="mg-canvas"
        @click="focusCanvas"
        @focus="focused = true"
        @blur="focused = false"
      />
      <div v-if="landing" class="mg-landing" :style="spawn" aria-hidden="true">
        <DuckSprite :size="64" />
      </div>
      <transition name="mg-ouch">
        <div v-if="ouch" class="mg-ouch">
          <span class="mg-bandage" aria-hidden="true">🩹</span>
          <div>
            <b>{{ ouch[0] }}</b>
            <div>{{ ouch[1] }}</div>
          </div>
        </div>
      </transition>
      <div v-if="levelError" class="mg-error">
        <b>level.ts failed — keeping previous level</b>
        <div>{{ levelError }}</div>
      </div>
      <div v-if="physicsError" class="mg-error">
        <b>physics.ts failed — keeping previous physics</b>
        <div>{{ physicsError }}</div>
      </div>
    </div>

    <div class="mg-hud">
      <span>
        <b :class="stats && stats.fps >= 55 ? 'ok' : 'warn'">{{ stats?.fps ?? '—' }}</b> fps
        <span class="muted">(target {{ FPS }})</span>
      </span>
      <span v-if="!compact">jump <b>{{ stats?.jumpVelocity ?? '—' }}</b> px/f</span>
      <span>
        input:
        <b v-if="stats?.controller.connected" class="ok">DualShock 4</b>
        <b v-else-if="focused" class="ok">keyboard</b>
        <span v-else class="warn">{{ compact ? 'press a button' : 'press a controller button, or click canvas for keyboard' }}</span>
      </span>
      <span v-if="stats && stats.levelVersion > 0" class="ok">level v{{ stats.levelVersion }} live</span>
      <span v-if="stats && stats.physicsVersion > 0" class="ok">physics v{{ stats.physicsVersion }} live</span>
      <span v-if="stats && stats.ouches > 0" class="warn">🩹 ×{{ stats.ouches }}</span>
      <span v-for="w in stats?.levelWarnings ?? []" :key="w" class="warn">⚠ {{ w }}</span>
    </div>
  </div>
</template>

<style scoped>
.mg-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  --mg-max-h: min(370px, 62vh);
}
.mg-root.compact {
  --mg-max-h: min(300px, 50vh);
}
.mg-landing {
  position: absolute;
  line-height: 0;
  view-transition-name: duck;
}
.mg-landing svg {
  width: 100%;
  height: 100%;
}
.mg-ouch {
  position: absolute;
  left: 50%;
  top: 38%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 1px solid #f1aeb5;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 16px rgba(33, 37, 41, 0.12);
  line-height: 1.35;
  font-size: 0.8rem;
  color: #58151c;
  white-space: nowrap;
}
.mg-ouch b {
  color: #a51c30;
}
.mg-bandage {
  font-size: 1.6rem;
  line-height: 1;
}
.mg-ouch-enter-active,
.mg-ouch-leave-active {
  transition: opacity 200ms, transform 200ms;
}
.mg-ouch-enter-from,
.mg-ouch-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.92);
}
.mg-frame {
  position: relative;
  max-width: 100%;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  overflow: hidden;
  line-height: 0;
  transition: border-color 120ms, box-shadow 120ms;
}
.mg-frame.focused {
  border-color: #a51c30;
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.15);
}
.mg-frame.flash {
  border-color: #a51c30;
  box-shadow: 0 0 0 4px rgba(165, 28, 48, 0.35);
}
.mg-frame.broken {
  border-color: #dc3545;
}
.mg-canvas {
  /* Intrinsic 960×544; scale to fit both the column width and the slide height. */
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: var(--mg-max-h);
  outline: none;
  cursor: pointer;
  image-rendering: pixelated;
}
.mg-error {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.5rem 0.8rem;
  line-height: 1.4;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: #58151c;
  background: #f8d7da; /* Bootstrap alert-danger */
  border-top: 1px solid #f1aeb5;
}
.mg-hud {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem 1.2rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: #6c757d;
}
.mg-hud b {
  color: #212529;
}
.mg-hud .ok {
  color: #198754; /* Bootstrap success */
}
.mg-hud .warn {
  color: #a51c30;
}
.mg-hud .muted {
  color: #adb5bd;
}
</style>
