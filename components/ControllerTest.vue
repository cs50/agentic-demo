<script setup lang="ts">
/**
 * ControllerTest — the "verification harness first" diagnostic from the spec.
 * Prints real-time button and axis events, e.g. `Button 0 (CROSS): DOWN`.
 * Only polls while this slide is the active one.
 */
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Controller, DS4_AXES, DS4_BUTTONS, type ControllerEvent } from '../demo/mario/controller'

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
const MAX_LOG = 12

let raf = 0
let unsubscribe: (() => void) | null = null

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
      if (Math.abs(ev.value) > 0.5 || Math.abs(ev.value) < 0.05)
        push(`Axis ${ev.index} (${ev.name}): ${ev.value.toFixed(2)}`)
      break
  }
}

function loop() {
  controller.poll()
  raf = requestAnimationFrame(loop)
}

function start() {
  if (!isLive || raf) return
  unsubscribe = controller.subscribe(onEvent)
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

const buttonOrder = [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 8, 9, 16]
</script>

<template>
  <div class="ct-root">
    <div class="ct-status" :class="connected ? 'ok' : 'wait'">
      <span class="dot" />
      <span v-if="connected">
        <b>{{ gamepadId }}</b>
        <span class="muted"> · mapping: {{ mapping }}</span>
      </span>
      <span v-else>Waiting for controller — press any button on the DualShock 4…</span>
    </div>

    <div class="ct-grid">
      <div class="ct-panel">
        <div class="ct-title">Buttons</div>
        <div class="ct-buttons">
          <div v-for="i in buttonOrder" :key="i" class="btn" :class="{ on: buttons[i] }">
            <span class="idx">{{ i }}</span>
            <span class="name">{{ DS4_BUTTONS[i] }}</span>
          </div>
        </div>

        <div class="ct-title mt">Axes</div>
        <div v-for="i in 4" :key="i" class="axis">
          <span class="label">{{ i - 1 }} {{ DS4_AXES[i - 1] }}</span>
          <div class="track">
            <div class="center" />
            <div class="thumb" :style="{ left: `${50 + axes[i - 1] * 50}%` }" />
          </div>
          <span class="val">{{ axes[i - 1].toFixed(2) }}</span>
        </div>
      </div>

      <div class="ct-panel">
        <div class="ct-title">stdout — test_controller</div>
        <pre class="ct-log"><template v-if="log.length"><div v-for="(l, i) in log" :key="l + i" :class="{ newest: i === 0 }">{{ l }}</div></template><div v-else class="muted">// no events yet</div></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ct-root {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: #212529;
}
.ct-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  background: #fff3cd; /* Bootstrap alert-warning while waiting */
  border: 1px solid #ffe69c;
  color: #664d03;
  margin-bottom: 0.8rem;
}
.ct-status.ok {
  background: #d1e7dd; /* Bootstrap alert-success once connected */
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
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}
.ct-panel {
  min-width: 0; /* allow grid children to shrink below content width */
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.7rem 0.8rem;
}
.ct-title {
  color: #a51c30;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.65rem;
  margin-bottom: 0.5rem;
}
.ct-title.mt {
  margin-top: 0.9rem;
}
.ct-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.3rem;
}
.btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 0;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  color: #6c757d;
  background: #f8f9fa;
  transition: all 60ms linear;
}
.btn .idx {
  font-size: 0.6rem;
  opacity: 0.7;
}
.btn .name {
  font-size: 0.55rem;
}
.btn.on {
  background: #a51c30;
  border-color: #a51c30;
  color: #fff;
}
.axis {
  display: grid;
  grid-template-columns: 5.5rem 1fr 3rem;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.axis .label {
  color: #6c757d;
  font-size: 0.65rem;
}
.axis .track {
  position: relative;
  height: 10px;
  background: #e9ecef;
  border-radius: 5px;
}
.axis .center {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #adb5bd;
}
.axis .thumb {
  position: absolute;
  top: -3px;
  width: 16px;
  height: 16px;
  margin-left: -8px;
  border-radius: 50%;
  background: #a51c30;
  transition: left 40ms linear;
}
.axis .val {
  text-align: right;
  color: #212529;
}
.ct-log {
  margin: 0;
  padding: 0;
  background: transparent;
  line-height: 1.5;
  min-height: 15rem;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
}
.ct-log .newest {
  color: #a51c30;
  font-weight: 700;
}
</style>
