<script setup lang="ts">
/**
 * LiveSource — renders one of the live files on the slide and animates the
 * diff (Shiki Magic Move) every time the file is saved.
 */
import { ShikiMagicMove } from '@shikijs/magic-move/vue'
import '@shikijs/magic-move/style.css'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { computed, onMounted, shallowRef } from 'vue'
import { sourceOf, type LiveFile } from '../demo/mario/liveSource'

const props = withDefaults(
  defineProps<{ file?: LiveFile; duration?: number; stagger?: number; bare?: boolean }>(),
  { file: 'demo/mario/level.ts', duration: 700, stagger: 4, bare: false },
)

const code = computed(() => sourceOf(props.file).value)

const highlighter = shallowRef<HighlighterCore | null>(null)

onMounted(async () => {
  highlighter.value = await createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs')],
    langs: [import('shiki/langs/typescript.mjs')],
    engine: createJavaScriptRegexEngine(),
  })
})
</script>

<template>
  <div class="ls-root" :class="{ bare }">
    <div v-if="!bare" class="ls-bar">
      <span class="ls-dot" /><span class="ls-dot" /><span class="ls-dot" />
      <span class="ls-file">{{ props.file }}</span>
      <span class="ls-live">● live</span>
    </div>
    <div class="ls-body">
      <ShikiMagicMove
        v-if="highlighter"
        :highlighter="highlighter"
        lang="typescript"
        theme="github-light"
        :code="code"
        :options="{ duration: props.duration, stagger: props.stagger, lineNumbers: true }"
      />
      <pre v-else class="ls-fallback">{{ code }}</pre>
    </div>
  </div>
</template>

<style scoped>
.ls-root {
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background: #f8f8f8;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  height: 100%;
}
.ls-root.bare {
  border: 0;
  border-radius: 0;
}
.ls-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.65rem;
  color: #6c757d;
}
.ls-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #dee2e6;
}
.ls-file {
  margin-left: 0.4rem;
  color: #212529;
}
.ls-live {
  margin-left: auto;
  color: #a51c30;
  font-weight: 700;
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
  opacity: 0.4;
  margin-right: 1em;
  user-select: none;
}
.ls-fallback {
  margin: 0;
  color: #212529;
  white-space: pre;
}
</style>
