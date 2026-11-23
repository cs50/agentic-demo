<script setup lang="ts">
/**
 * FollowControl — the small pill in a viewer's corner: "Following" while the
 * deck tracks the presenter, "Unlocked" after the viewer navigated by hand.
 * Tapping toggles; tapping Follow jumps to wherever the presenter is now.
 *
 * Shown only on a deck that is connected to the hub as audience, on the play
 * route (see canFollow in composables/hubSync.ts). The presenter never sees it.
 */
import { canFollow, follow, following, unlock } from '../composables/hubSync'

function toggle() {
  if (following.value) unlock()
  else follow()
}
</script>

<template>
  <button
    v-if="canFollow"
    type="button"
    class="fc"
    :class="{ on: following }"
    :title="following ? 'Following the presenter. Tap to browse on your own.' : 'Tap to jump back to the presenter and follow along.'"
    @click="toggle"
  >
    <span class="fc-dot" aria-hidden="true" />
    <span v-if="following">Following</span>
    <span v-else>Unlocked · tap to follow</span>
  </button>
</template>

<style scoped>
.fc {
  position: absolute;
  right: 0.8rem;
  bottom: 0.8rem;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--cs50-border);
  background: rgba(255, 255, 255, 0.92);
  color: var(--cs50-muted);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 10px rgba(33, 37, 41, 0.1);
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: border-color 200ms, color 200ms;
}
.fc.on {
  border-color: var(--cs50-crimson);
  color: var(--cs50-crimson);
}
.fc-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #adb5bd;
}
.fc.on .fc-dot {
  background: var(--cs50-crimson);
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.18);
}
</style>
