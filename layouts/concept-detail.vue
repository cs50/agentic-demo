<!--
  concept-detail — the "Explanation & CS50 Finance Example" slide of each concept pair.

  Usage:
  ---
  layout: concept-detail
  concept: 3
  title: Tool Calling & Execution Loops
  ---
  Explanation paragraph (default slot).

  ::example::
  - CS50 Finance example bullets

  ::takeaway::
  The agent forms a closed feedback loop with the operating environment.

  Clicks: the example appears on the first click, the takeaway on the second,
  so one idea lands at a time. Set `reveal: false` in the frontmatter to show
  everything at once (useful for the PDF export).
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
    /** Label on the example panel. Defaults to the lecture's anchor. */
    exampleLabel?: string
    reveal?: boolean
  }>(),
  { exampleLabel: 'CS50 Finance example', reveal: true },
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
        <div class="cd-label">What it is</div>
        <slot />
      </section>

      <section class="cd-example" :class="{ 'cd-static': !reveal }">
        <div class="cd-label cd-label-example">
          <span class="cd-badge">{{ exampleLabel }}</span>
        </div>
        <div v-if="reveal" v-click>
          <slot name="example" />
        </div>
        <div v-else>
          <slot name="example" />
        </div>
      </section>
    </div>

    <footer class="cd-takeaway">
      <div v-if="reveal" v-click class="cd-takeaway-inner">
        <span class="cd-takeaway-label">Core takeaway</span>
        <div class="cd-takeaway-text"><slot name="takeaway" /></div>
      </div>
      <div v-else class="cd-takeaway-inner">
        <span class="cd-takeaway-label">Core takeaway</span>
        <div class="cd-takeaway-text"><slot name="takeaway" /></div>
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
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  padding-bottom: 0.6rem;
}
.cd-number {
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #38bdf8;
  font-weight: 700;
  white-space: nowrap;
}
.cd-title {
  font-size: 1.7rem;
  font-weight: 700;
  margin: 0;
  color: #f8fafc;
  line-height: 1.2;
}

/* Body: explanation left, example right */
.cd-body {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1.6rem;
  min-height: 0;
}
.cd-label {
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
.cd-explanation :deep(p) {
  font-size: 1.05rem;
  line-height: 1.55;
  color: #e2e8f0;
  margin: 0 0 0.6rem;
}
.cd-explanation :deep(strong) {
  color: #38bdf8;
}

.cd-example {
  align-self: start; /* hug content instead of stretching to the row height */
  background: rgba(52, 211, 153, 0.06);
  border: 1px solid rgba(52, 211, 153, 0.25);
  border-radius: 12px;
  padding: 0.9rem 1.1rem 1rem;
}
.cd-badge {
  display: inline-block;
  background: #34d399;
  color: #0f172a;
  border-radius: 999px;
  padding: 0.15rem 0.7rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cd-example :deep(p),
.cd-example :deep(li) {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #e2e8f0;
}
.cd-example :deep(ul),
.cd-example :deep(ol) {
  margin: 0;
  padding-left: 1.1rem;
}
.cd-example :deep(li) {
  margin: 0.3rem 0;
}
.cd-example :deep(li::marker) {
  color: #34d399;
}
.cd-example :deep(strong) {
  color: #34d399;
}
.cd-example :deep(code) {
  font-size: 0.85em;
}

/* Takeaway banner */
.cd-takeaway-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.14), rgba(52, 211, 153, 0.12));
  border-left: 4px solid #38bdf8;
  border-radius: 10px;
  padding: 0.75rem 1.1rem;
}
.cd-takeaway-label {
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #38bdf8;
  font-weight: 800;
  white-space: nowrap;
}
.cd-takeaway-text :deep(p) {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.4;
}
</style>
