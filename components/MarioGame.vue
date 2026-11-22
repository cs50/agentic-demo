<script setup lang="ts">
/**
 * MarioGame — embeds the canvas game in a slide.
 * The engine runs only while this slide is active in the main/presenter view,
 * never in the overview grid or the "next slide" preview.
 */
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Engine, FPS, GRAVITY, JUMP_VELOCITY, type EngineStats } from '../demo/mario/engine'
import { buildLevel } from '../demo/mario/level'
import { buildWorld } from '../demo/mario/world'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { $renderContext } = useSlideContext()
const isLive = ['slide', 'presenter'].includes($renderContext.value)
const isActive = useIsSlideActive()

const canvas = ref<HTMLCanvasElement | null>(null)
const stats = ref<EngineStats | null>(null)
const focused = ref(false)

let engine: Engine | null = null

function start() {
  if (!isLive || !canvas.value) return
  stop()
  engine = new Engine(buildWorld(buildLevel()))
  engine.start(canvas.value, (s) => (stats.value = s))
  // Expose for on-stage diagnostics (e.g. from DevTools): window.__mario.playerState
  if (import.meta.env.DEV) (window as any).__mario = engine
}

function stop() {
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
    <div class="mg-frame" :class="{ focused }">
      <canvas
        ref="canvas"
        tabindex="0"
        class="mg-canvas"
        @click="focusCanvas"
        @focus="focused = true"
        @blur="focused = false"
      />
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
  border-radius: 10px;
  border: 2px solid rgba(56, 189, 248, 0.25);
  overflow: hidden;
  line-height: 0;
  transition: border-color 120ms, box-shadow 120ms;
}
.mg-frame.focused {
  border-color: #34d399;
  box-shadow: 0 0 24px rgba(52, 211, 153, 0.35);
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
.mg-hud {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem 1.2rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: #cbd5e1;
}
.mg-hud b {
  color: #38bdf8;
}
.mg-hud .ok {
  color: #34d399;
}
.mg-hud .warn {
  color: #f59e0b;
}
.mg-hud .muted {
  color: #64748b;
}
</style>
