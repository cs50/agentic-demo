<!--
  concept-title — opens each concept pair.

  Usage:
  ---
  layout: concept-title
  concept: 3
  sequence: Tool Use and the Single Agent
  ---
  # Tool Calling and Execution Loops
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
    <div class="ct-number">Concept {{ padded }}</div>
    <div class="ct-title">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.concept-title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 4rem;
  position: relative;
  border-left: 12px solid var(--cs50-crimson);
}
.ct-sequence {
  position: absolute;
  top: 2.2rem;
  left: 4rem;
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--cs50-muted);
}
.ct-number {
  font-size: 1rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--cs50-crimson);
  font-weight: 700;
  margin-bottom: 0.6rem;
}
.ct-title :deep(h1) {
  font-size: 3.2rem;
  line-height: 1.1;
  font-weight: 700;
  color: var(--cs50-body);
  margin: 0;
  padding: 0;
  border: 0;
  max-width: 18ch;
}
</style>
