<script setup lang="ts">
/**
 * DualShock — a DualShock 4 drawn in SVG, with every button and both sticks
 * reflecting the live gamepad state. Button indices follow the W3C "standard"
 * mapping that Chrome applies to the DualShock 4 (see controller.ts).
 *
 *   buttons[i] true  → that button is lit
 *   axes[0..3]       → left/right stick offset, -1..1
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ buttons?: boolean[]; axes?: number[]; connected?: boolean; highlight?: number[] }>(),
  { buttons: () => [], axes: () => [0, 0, 0, 0], connected: false, highlight: () => [] },
)

const on = (i: number) => !!props.buttons[i]
const hot = (i: number) => props.highlight.includes(i)
const stickL = computed(() => ({ x: 150 + (props.axes[0] ?? 0) * 12, y: 158 + (props.axes[1] ?? 0) * 12 }))
const stickR = computed(() => ({ x: 290 + (props.axes[2] ?? 0) * 12, y: 158 + (props.axes[3] ?? 0) * 12 }))
</script>

<template>
  <svg viewBox="0 0 440 240" class="ds4" :class="{ connected }" aria-label="DualShock 4 controller">
    <!-- body -->
    <path
      class="body"
      d="M96,70 C70,70 46,92 42,120 L26,186 C22,210 38,228 58,228 C78,228 90,214 100,198 L124,172 L316,172 L340,198 C350,214 362,228 382,228 C402,228 418,210 414,186 L398,120 C394,92 370,70 344,70 Z"
    />
    <!-- touchpad (17) -->
    <rect class="btn pad" :class="{ on: on(17) }" x="170" y="78" width="100" height="40" rx="8" />
    <!-- share (8) / options (9) -->
    <rect class="btn small" :class="{ on: on(8) }" x="150" y="82" width="12" height="20" rx="4" />
    <rect class="btn small" :class="{ on: on(9) }" x="278" y="82" width="12" height="20" rx="4" />
    <!-- PS (16) -->
    <circle class="btn small" :class="{ on: on(16) }" cx="220" cy="140" r="8" />

    <!-- shoulders L1 (4) R1 (5), triggers L2 (6) R2 (7) -->
    <rect class="btn shoulder" :class="{ on: on(6) }" x="88" y="38" width="48" height="14" rx="6" />
    <rect class="btn shoulder" :class="{ on: on(4) }" x="84" y="56" width="56" height="12" rx="5" />
    <rect class="btn shoulder" :class="{ on: on(7) }" x="304" y="38" width="48" height="14" rx="6" />
    <rect class="btn shoulder" :class="{ on: on(5) }" x="300" y="56" width="56" height="12" rx="5" />
    <text class="lbl" x="112" y="48">L2</text>
    <text class="lbl" x="112" y="65">L1</text>
    <text class="lbl" x="328" y="48">R2</text>
    <text class="lbl" x="328" y="65">R1</text>

    <!-- d-pad: up 12, down 13, left 14, right 15 -->
    <g class="dpad">
      <rect class="btn" :class="{ on: on(12), hot: hot(12) }" x="86" y="86" width="20" height="22" rx="3" />
      <rect class="btn" :class="{ on: on(13), hot: hot(13) }" x="86" y="130" width="20" height="22" rx="3" />
      <rect class="btn" :class="{ on: on(14), hot: hot(14) }" x="64" y="108" width="22" height="20" rx="3" />
      <rect class="btn" :class="{ on: on(15), hot: hot(15) }" x="106" y="108" width="22" height="20" rx="3" />
      <rect class="btn center" x="86" y="108" width="20" height="20" />
    </g>

    <!-- face buttons: triangle 3, circle 1, cross 0, square 2 -->
    <g class="face">
      <circle class="btn" :class="{ on: on(3), hot: hot(3) }" cx="344" cy="96" r="12" />
      <path class="glyph tri" d="M344,89 L351,102 L337,102 Z" />
      <circle class="btn" :class="{ on: on(1), hot: hot(1) }" cx="368" cy="120" r="12" />
      <circle class="glyph circ" cx="368" cy="120" r="6" />
      <circle class="btn" :class="{ on: on(0), hot: hot(0) }" cx="344" cy="144" r="12" />
      <path class="glyph cross" d="M339,139 L349,149 M349,139 L339,149" />
      <circle class="btn" :class="{ on: on(2), hot: hot(2) }" cx="320" cy="120" r="12" />
      <rect class="glyph sq" x="314.5" y="114.5" width="11" height="11" />
    </g>

    <!-- sticks: L3 10, R3 11 -->
    <g class="stick">
      <circle class="well" cx="150" cy="158" r="24" />
      <circle class="btn cap" :class="{ on: on(10) }" :cx="stickL.x" :cy="stickL.y" r="17" />
      <circle class="well" cx="290" cy="158" r="24" />
      <circle class="btn cap" :class="{ on: on(11) }" :cx="stickR.x" :cy="stickR.y" r="17" />
    </g>

    <!-- light bar -->
    <rect class="lightbar" x="196" y="70" width="48" height="4" rx="2" />
  </svg>
</template>

<style scoped>
.ds4 {
  width: 100%;
  height: auto;
  display: block;
}
.body {
  fill: #f1f3f5;
  stroke: #adb5bd;
  stroke-width: 2;
}
.btn {
  fill: #fff;
  stroke: #adb5bd;
  stroke-width: 1.5;
  transition: fill 60ms linear, stroke 60ms linear;
}
.btn.center {
  fill: #e9ecef;
  stroke: none;
}
.btn.on {
  fill: #a51c30;
  stroke: #a51c30;
}
.btn.hot:not(.on) {
  stroke: #a51c30;
  stroke-dasharray: 3 2;
}
.pad {
  fill: #f8f9fa;
}
.pad.on {
  fill: #a51c30;
}
.well {
  fill: #dee2e6;
}
.cap {
  fill: #ced4da;
  stroke: #adb5bd;
  transition: cx 40ms linear, cy 40ms linear, fill 60ms linear;
}
.cap.on {
  fill: #a51c30;
}
.lbl {
  font-family: 'PT Sans', sans-serif;
  font-size: 9px;
  font-weight: 700;
  fill: #6c757d;
  text-anchor: middle;
}
.glyph {
  pointer-events: none;
  fill: none;
  stroke-width: 2;
}
.glyph.tri {
  stroke: #1f9d55;
}
.glyph.circ {
  stroke: #d64545;
}
.glyph.cross {
  stroke: #3b7dd8;
}
.glyph.sq {
  stroke: #c2559d;
}
.btn.on + .glyph {
  stroke: #fff;
}
.lightbar {
  fill: #adb5bd;
}
.connected .lightbar {
  fill: #3b7dd8;
}
</style>
