<!--
  concept-detail — the explanation-and-example slide of each concept pair.

  Usage:
  ---
  layout: concept-detail
  concept: 3
  title: Tool Calling and Execution Loops
  ---
  Explanation (default slot).

  ::example::
  - What this looks like in C$50 Finance

  ::takeaway::
  One sentence to remember.

  Clicks: the example appears on the first click, the takeaway on the second.
  Set `reveal: false` in the frontmatter to show everything at once.
-->

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    concept: number | string
    /**
     * Slidev reserves `title` in frontmatter (it drives the TOC), so it is not
     * passed as a direct prop. We read it from the `frontmatter` object instead,
     * which Slidev always provides to layouts.
     */
    frontmatter?: Record<string, any>
    /** Label on the example panel. */
    exampleLabel?: string
    reveal?: boolean
  }>(),
  { exampleLabel: 'In C$50 Finance', reveal: true },
)

const padded = String(props.concept).padStart(2, '0')
const title = computed(() => props.frontmatter?.title ?? '')
</script>

<template>
  <div class="slidev-layout concept-detail">
    <header class="cd-header">
      <span class="cd-number">Concept {{ padded }}</span>
      <h1 class="cd-title">{{ title }}</h1>
    </header>

    <div class="cd-body">
      <section class="cd-explanation">
        <slot />
      </section>

      <section class="cd-example">
        <div class="cd-example-label">{{ exampleLabel }}</div>
        <div v-if="reveal" v-click>
          <slot name="example" />
        </div>
        <div v-else>
          <slot name="example" />
        </div>
      </section>
    </div>

    <footer class="cd-takeaway">
      <div v-if="reveal" v-click class="takeaway-banner">
        <span class="label">Takeaway</span>
        <span class="cd-takeaway-text"><slot name="takeaway" /></span>
      </div>
      <div v-else class="takeaway-banner">
        <span class="label">Takeaway</span>
        <span class="cd-takeaway-text"><slot name="takeaway" /></span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.concept-detail {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  padding: 2.2rem 3rem 2rem;
}

/* Header */
.cd-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  border-bottom: 1px solid var(--cs50-rule);
  padding-bottom: 0.5rem;
}
.cd-number {
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--cs50-crimson);
  font-weight: 700;
  white-space: nowrap;
}
.cd-title {
  font-size: 1.7rem;
  font-weight: 700;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--cs50-body);
  line-height: 1.2;
}

/* Body: explanation left, example right */
.cd-body {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1.6rem;
  min-height: 0;
}
.cd-explanation :deep(p) {
  font-size: 1.08rem;
  line-height: 1.55;
  color: var(--cs50-body);
  margin: 0 0 0.7rem;
}

.cd-example {
  align-self: start;
  border: 1px solid var(--cs50-border);
  border-top: 3px solid var(--cs50-crimson);
  border-radius: 6px;
  padding: 0.8rem 1.1rem 1rem;
  background: #fff;
}
.cd-example-label {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cs50-crimson);
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.cd-example :deep(p),
.cd-example :deep(li) {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--cs50-body);
}
.cd-example :deep(p) {
  margin: 0 0 0.4rem;
}
.cd-example :deep(ul),
.cd-example :deep(ol) {
  margin: 0;
  padding-left: 1.1rem;
}
.cd-example :deep(li) {
  margin: 0.3rem 0;
}
.cd-example :deep(code) {
  font-size: 0.85em;
}

/* Takeaway */
.cd-takeaway-text :deep(p) {
  display: inline;
  margin: 0;
}
</style>
