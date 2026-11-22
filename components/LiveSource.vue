<script setup lang="ts">
/**
 * LiveSource — renders demo/mario/level.ts on the slide and animates the diff
 * (Shiki Magic Move) every time the agent saves the file.
 */
import { ShikiMagicMove } from '@shikijs/magic-move/vue'
import '@shikijs/magic-move/style.css'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { onMounted, shallowRef } from 'vue'
import { levelSource } from '../demo/mario/liveSource'

const props = withDefaults(
  defineProps<{ file?: string; duration?: number; stagger?: number }>(),
  { file: 'demo/mario/level.ts', duration: 700, stagger: 4 },
)

const highlighter = shallowRef<HighlighterCore | null>(null)

onMounted(async () => {
  highlighter.value = await createHighlighterCore({
    themes: [import('shiki/themes/vitesse-dark.mjs')],
    langs: [import('shiki/langs/typescript.mjs')],
    engine: createJavaScriptRegexEngine(),
  })
})
</script>

<template>
  <div class="ls-root">
    <div class="ls-bar">
      <span class="ls-dot" /><span class="ls-dot" /><span class="ls-dot" />
      <span class="ls-file">{{ props.file }}</span>
      <span class="ls-live">● live</span>
    </div>
    <div class="ls-body">
      <ShikiMagicMove
        v-if="highlighter"
        :highlighter="highlighter"
        lang="typescript"
        theme="vitesse-dark"
        :code="levelSource"
        :options="{ duration: props.duration, stagger: props.stagger, lineNumbers: true }"
      />
      <pre v-else class="ls-fallback">{{ levelSource }}</pre>
    </div>
  </div>
</template>

<style scoped>
.ls-root {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #0b1120;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  height: 100%;
}
.ls-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  background: rgba(148, 163, 184, 0.08);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  font-size: 0.65rem;
  color: #94a3b8;
}
.ls-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.35);
}
.ls-file {
  margin-left: 0.4rem;
  color: #e2e8f0;
}
.ls-live {
  margin-left: auto;
  color: #34d399;
}
.ls-body {
  flex: 1;
  overflow: auto;
  padding: 0.6rem 0.4rem;
  font-size: 0.66rem;
  line-height: 1.5;
}
.ls-body :deep(.shiki-magic-move-container) {
  background: transparent !important;
}
.ls-body :deep(.shiki-magic-move-line-number) {
  opacity: 0.35;
  margin-right: 1em;
  user-select: none;
}
.ls-fallback {
  margin: 0;
  color: #cbd5e1;
  white-space: pre;
}
</style>
