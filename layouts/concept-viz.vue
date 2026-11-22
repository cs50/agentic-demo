<!--
  concept-viz — a full-width visualization slide, placed between a concept's
  title slide and its explanation slide.

  Usage:
  ---
  layout: concept-viz
  concept: 2
  title: Chatbots and Turn-by-Turn Prompting
  caption: Press → to advance a turn. Notice who is doing the work.
  ---
  <ChatSim />
-->

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  concept?: number | string
  /** Slidev reserves `title`; read it from the frontmatter object instead. */
  frontmatter?: Record<string, any>
  /** Small line under the visualization; usually the presenter's cue. */
  caption?: string
  /** Overline label when there is no concept number (hook, synthesis). */
  kicker?: string
}>()

const padded = computed(() => (props.concept != null ? String(props.concept).padStart(2, '0') : null))
const title = computed(() => props.frontmatter?.title ?? '')
</script>

<template>
  <div class="slidev-layout concept-viz">
    <header class="cv-header">
      <span v-if="padded" class="cv-number">Concept {{ padded }}</span>
      <span v-else-if="kicker" class="cv-number">{{ kicker }}</span>
      <h1 class="cv-title">{{ title }}</h1>
    </header>
    <div class="cv-body">
      <slot />
    </div>
    <footer v-if="caption" class="cv-caption">{{ caption }}</footer>
  </div>
</template>

<style scoped>
.concept-viz {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.6rem;
  padding: 1.6rem 2.4rem 1.2rem;
}
.cv-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  border-bottom: 1px solid var(--cs50-rule);
  padding-bottom: 0.4rem;
}
.cv-number {
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--cs50-crimson);
  font-weight: 700;
  white-space: nowrap;
}
.cv-title {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--cs50-body);
  line-height: 1.2;
}
.cv-body {
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.cv-body > :deep(*) {
  flex: 1;
  min-height: 0;
}
.cv-caption {
  font-size: 0.85rem;
  color: var(--cs50-muted);
  text-align: center;
}
</style>
