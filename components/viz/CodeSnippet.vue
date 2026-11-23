<script setup lang="ts">
/**
 * CodeSnippet — small highlighted code block for visualizations.
 * `mark` highlights 1-based line numbers (e.g. the line with the bug).
 */
import { computed, onMounted, shallowRef, watch } from 'vue'
import { getHighlighter, SHIKI_THEME } from './highlighter'

const props = withDefaults(
  defineProps<{ code: string; lang?: 'python' | 'typescript' | 'sql'; mark?: number[]; lines?: boolean }>(),
  { lang: 'python', mark: () => [], lines: false },
)

const html = shallowRef('')

async function render() {
  const hl = await getHighlighter()
  html.value = hl.codeToHtml(props.code.trimEnd(), {
    lang: props.lang,
    theme: SHIKI_THEME,
    transformers: [
      {
        line(node, line) {
          if (props.mark.includes(line)) this.addClassToHast(node, 'marked')
          if (props.lines) node.properties['data-line'] = String(line)
        },
      },
    ],
  })
}

onMounted(render)
watch(() => [props.code, props.mark.join(',')], render)

const classes = computed(() => ({ 'with-lines': props.lines }))
</script>

<template>
  <div class="snippet" :class="classes" v-html="html" />
</template>

<style scoped>
.snippet :deep(pre) {
  margin: 0;
  padding: 0.5rem 0.7rem;
  font-size: 0.7rem;
  line-height: 1.55;
  background: var(--cs50-code-bg) !important;
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  overflow: hidden;
  font-variant-ligatures: none;
}
.snippet :deep(.line) {
  display: block;
  transition: background-color 250ms;
}
.snippet :deep(.line.marked) {
  background: rgba(165, 28, 48, 0.1);
  box-shadow: inset 3px 0 0 var(--cs50-crimson);
}
.snippet.with-lines :deep(.line)::before {
  content: attr(data-line);
  display: inline-block;
  width: 1.6em;
  margin-right: 0.8em;
  color: var(--cs50-muted);
  opacity: 0.6;
  text-align: right;
  user-select: none;
}
</style>
