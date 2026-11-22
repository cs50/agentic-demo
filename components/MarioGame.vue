<script setup lang="ts">
/**
 * MarioGame — embeds the canvas game in a slide.
 *
 * - Runs only while its slide is active in the main/presenter view, never in
 *   the overview grid or the "next slide" preview.
 * - Subscribes to liveLevel.ts: when the agent edits level.ts, the level is
 *   rebuilt under the player with no remount.
 */
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Engine, FPS, GRAVITY, JUMP_VELOCITY, type EngineStats } from '../demo/mario/engine'
import { currentLevel, levelReady, onLevelChange } from '../demo/mario/liveLevel'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { $renderContext } = useSlideContext()
const isLive = ['slide', 'presenter'].includes($renderContext.value)
const isActive = useIsSlideActive()

const canvas = ref<HTMLCanvasElement | null>(null)
const stats = ref<EngineStats | null>(null)
const focused = ref(false)
const levelError = ref<string | null>(currentLevel().error)
const flash = ref(false)

let engine: Engine | null = null
let unsubscribe: (() => void) | null = null
let flashTimer = 0

let startToken = 0

async function start() {
  if (!isLive || !canvas.value) return
  stop()
  // Wait for level.ts to load (it's imported dynamically so a broken file can't
  // take the slide down). Bail if the slide was left while we waited.
  const token = ++startToken
  await levelReady
  if (token !== startToken || !canvas.value) return
  // We were unsubscribed while inactive, so resync both world and error state.
  const level = currentLevel()
  levelError.value = level.error
  engine = new Engine(level.world)
  engine.start(canvas.value, (s) => (stats.value = s))
  unsubscribe = onLevelChange((update) => {
    levelError.value = update.error
    if (update.error || !engine) return
    engine.setWorld(update.world)
    flash.value = true
    clearTimeout(flashTimer)
    flashTimer = window.setTimeout(() => (flash.value = false), 600)
  })
  // Expose for on-stage diagnostics (e.g. from DevTools): window.__mario.playerState
  if (import.meta.env.DEV) (window as any).__mario = engine
}

function stop() {
  startToken++ // cancel any start() still awaiting levelReady
  unsubscribe?.()
  unsubscribe = null
  engine?.stop()
  engine = null
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
    <div class="mg-frame" :class="{ focused, flash, broken: !!levelError }">
      <canvas
        ref="canvas"
        tabindex="0"
        class="mg-canvas"
        @click="focusCanvas"
        @focus="focused = true"
        @blur="focused = false"
      />
      <div v-if="levelError" class="mg-error">
        <b>level.ts failed — keeping previous level</b>
        <div>{{ levelError }}</div>
      </div>
    </div>

    <div class="mg-hud">
      <span>
        <b :class="stats && stats.fps >= 55 ? 'ok' : 'warn'">{{ stats?.fps ?? '—' }}</b> fps
        <span class="muted">(target {{ FPS }})</span>
      </span>
      <span v-if="!compact">gravity <b>{{ GRAVITY }}</b> px/f²</span>
      <span v-if="!compact">jump <b>{{ JUMP_VELOCITY }}</b> px/f</span>
      <span>
        input:
        <b v-if="stats?.controller.connected" class="ok">DualShock 4</b>
        <b v-else-if="focused" class="ok">keyboard</b>
        <span v-else class="warn">{{ compact ? 'press a button' : 'press a controller button, or click canvas for keyboard' }}</span>
      </span>
      <span v-if="stats && stats.levelVersion > 0" class="ok">level v{{ stats.levelVersion }} live</span>
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
