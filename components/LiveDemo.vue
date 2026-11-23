<script setup lang="ts">
/**
 * LiveDemo — the Step 7 slide: the game alone at full width first, then the
 * code panel beside it when the presenter is ready to change something.
 *
 * The → key (one click step, via useVizSteps) opens the code panel, so the
 * slide behaves like every other; the button in the corner does the same with
 * a mouse, and either can close it again to play full width.
 */
import { ref, watch } from 'vue'
import { useVizSteps } from '../composables/useVizSteps'
import LiveCode from './LiveCode.vue'
import MarioGame from './MarioGame.vue'

const { step } = useVizSteps(1)
const showCode = ref(step.value >= 1)
watch(step, (s) => (showCode.value = s >= 1))
</script>

<template>
  <div class="ld-root" :class="{ split: showCode }">
    <div class="ld-code">
      <LiveCode v-if="showCode" />
    </div>
    <div class="ld-game">
      <MarioGame :compact="showCode" />
    </div>
    <button type="button" class="ld-toggle" :title="showCode ? 'Hide the code' : 'Show the code'" @click="showCode = !showCode">
      {{ showCode ? 'Hide code' : 'Show code' }}
    </button>
  </div>
</template>

<style scoped>
.ld-root {
  position: relative;
  display: grid;
  grid-template-columns: 0fr 1fr;
  gap: 0;
  align-items: start;
  height: 100%;
  min-height: 0;
  transition: grid-template-columns 350ms ease, gap 350ms ease;
}
.ld-root.split {
  grid-template-columns: 1.05fr 1fr;
  gap: 1rem;
}
.ld-code {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.ld-game {
  min-width: 0;
}
.ld-game :deep(.mg-root) {
  --mg-max-h: 330px;
}
.ld-game :deep(.mg-root.compact) {
  --mg-max-h: 300px;
}
.ld-toggle {
  position: absolute;
  right: 0;
  top: -1.9rem;
  appearance: none;
  border: 1px solid var(--cs50-border);
  border-radius: 4px;
  background: #fff;
  color: var(--cs50-muted);
  font: inherit;
  font-size: 0.7rem;
  padding: 0.12rem 0.55rem;
  cursor: pointer;
}
.ld-toggle:hover {
  color: var(--cs50-body);
  border-color: var(--cs50-body);
}
</style>
