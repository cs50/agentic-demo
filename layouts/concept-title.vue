<!--
  concept-title — the "Bold Concept Callout" slide that opens each concept pair.

  Usage:
  ---
  layout: concept-title
  concept: 3
  sequence: Tool Use & The Single Agent
  ---
  # Tool Calling & Execution Loops
-->

<script setup lang="ts">
const props = defineProps<{
  /** Concept number, 1–10. Rendered zero-padded as "Concept 03". */
  concept: number | string
  /** Name of the sequence this concept belongs to (shown as a small label). */
  sequence?: string
}>()

const padded = String(props.concept).padStart(2, '0')
</script>

<template>
  <div class="slidev-layout concept-title">
    <div class="ct-sequence" v-if="sequence">{{ sequence }}</div>
    <div class="ct-number">
      <span class="ct-number-label">Concept</span>
      <span class="ct-number-value">{{ padded }}</span>
    </div>
    <div class="ct-title">
      <slot />
    </div>
    <div class="ct-rule" />
  </div>
</template>

<style scoped>
.concept-title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 4rem;
  position: relative;
}
.ct-sequence {
  position: absolute;
  top: 2.2rem;
  left: 4rem;
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #64748b;
}
.ct-number {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}
.ct-number-label {
  font-size: 1rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #38bdf8;
  font-weight: 600;
}
.ct-number-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: #38bdf8;
  font-variant-numeric: tabular-nums;
}
.ct-title :deep(h1) {
  font-size: 3.4rem;
  line-height: 1.1;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
  max-width: 18ch;
}
.ct-rule {
  width: 6rem;
  height: 4px;
  margin-top: 1.6rem;
  border-radius: 2px;
  background: linear-gradient(90deg, #38bdf8, #34d399);
}
</style>
