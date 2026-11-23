<script setup lang="ts">
/**
 * Tip — wrap any element to give it a hover/focus tooltip. Keyboard-reachable
 * (the wrapper is focusable) so the deck stays usable without a mouse.
 */
defineProps<{ text: string; side?: 'top' | 'bottom' }>()
</script>

<template>
  <span class="tip" tabindex="0">
    <slot />
    <span class="tip-bubble" :class="side ?? 'top'" role="tooltip">{{ text }}</span>
  </span>
</template>

<style scoped>
.tip {
  position: relative;
  display: inline-block;
  outline: none;
}
.tip-bubble {
  position: absolute;
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  z-index: 20;
  width: max-content;
  max-width: 16rem;
  padding: 0.35rem 0.55rem;
  border-radius: 6px;
  background: #212529;
  color: #fff;
  font-family: 'PT Sans', ui-sans-serif, system-ui, sans-serif;
  font-size: 0.7rem;
  line-height: 1.35;
  font-weight: 400;
  text-align: left;
  white-space: normal;
  pointer-events: none;
  display: none; /* out of layout (and scroll size) until shown */
}
@keyframes tip-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
}
.tip-bubble.top {
  bottom: calc(100% + 6px);
}
.tip-bubble.bottom {
  top: calc(100% + 6px);
}
.tip:hover .tip-bubble,
.tip:focus-visible .tip-bubble {
  display: block;
  transform: translateX(-50%);
  animation: tip-in 120ms ease;
}
</style>
