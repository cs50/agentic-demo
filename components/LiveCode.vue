<script setup lang="ts">
/**
 * LiveCode — the code panel on the demo slide, with two modes:
 *
 *   Preview  Read-only. Each save to level.ts (by the agent, or by you in
 *            Edit mode) morphs the old code into the new (Shiki Magic Move).
 *            Best while the agent is the one typing.
 *   Edit     A Monaco editor bound two ways to level.ts: disk changes appear
 *            in the editor, and edits autosave back to disk, which rebuilds
 *            the level under Mario. Best when you want to type on stage.
 */
import { nextTick, ref } from 'vue'
import LiveEditor, { type EditorStatus } from './LiveEditor.vue'
import LiveSource from './LiveSource.vue'

const props = withDefaults(defineProps<{ file?: string; mode?: 'preview' | 'edit' }>(), {
  file: 'demo/mario/level.ts',
  mode: 'preview',
})

const mode = ref<'preview' | 'edit'>(props.mode)
const status = ref<EditorStatus>('ready')
const editorRef = ref<InstanceType<typeof LiveEditor> | null>(null)

const statusLabel: Record<EditorStatus, string> = {
  ready: 'in sync',
  dirty: 'unsaved',
  saving: 'saving…',
  saved: 'saved',
  error: 'write failed',
  conflict: 'changed on disk',
}

async function setMode(m: 'preview' | 'edit') {
  mode.value = m
  if (m === 'edit') {
    await nextTick()
    editorRef.value?.focus()
  }
}
</script>

<template>
  <div class="lc-root">
    <div class="lc-bar">
      <span class="lc-dot" /><span class="lc-dot" /><span class="lc-dot" />
      <span class="lc-file">{{ file }}</span>

      <span v-if="mode === 'edit'" class="lc-status" :class="status">{{ statusLabel[status] }}</span>
      <span v-else class="lc-status ready">● live</span>

      <div class="lc-toggle" role="tablist" aria-label="Code panel mode">
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'preview'"
          :class="{ on: mode === 'preview' }"
          @click="setMode('preview')"
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'edit'"
          :class="{ on: mode === 'edit' }"
          @click="setMode('edit')"
        >
          Edit
        </button>
      </div>
    </div>

    <div class="lc-body">
      <LiveSource v-if="mode === 'preview'" :file="file" bare />
      <LiveEditor v-else ref="editorRef" @status="status = $event" />
    </div>
  </div>
</template>

<style scoped>
.lc-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background: #f8f8f8;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.lc-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.65rem;
  color: #6c757d;
}
.lc-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #dee2e6;
}
.lc-file {
  margin-left: 0.4rem;
  color: #212529;
}
.lc-status {
  margin-left: auto;
  font-weight: 700;
}
.lc-status.ready,
.lc-status.saved {
  color: #198754;
}
.lc-status.dirty,
.lc-status.saving {
  color: #6c757d;
}
.lc-status.conflict {
  color: #b58100;
}
.lc-status.error {
  color: #dc3545;
}
.lc-toggle {
  display: inline-flex;
  margin-left: 0.6rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}
.lc-toggle button {
  border: 0;
  background: #fff;
  color: #6c757d;
  font: inherit;
  font-size: 0.65rem;
  padding: 0.15rem 0.55rem;
  cursor: pointer;
}
.lc-toggle button + button {
  border-left: 1px solid #dee2e6;
}
.lc-toggle button.on {
  background: #a51c30;
  color: #fff;
  font-weight: 700;
}
.lc-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.lc-body > * {
  flex: 1;
  min-height: 0;
}
</style>
