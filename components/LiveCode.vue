<script setup lang="ts">
/**
 * LiveCode — the code panel on the demo slide: file tabs over a Preview/Edit toggle.
 *
 *   Preview  Read-only. Each save to the file (by the agent, or by you in Edit
 *            mode) morphs the old code into the new (Shiki Magic Move). Best
 *            while the agent is the one typing.
 *   Edit     A Monaco editor bound two ways to the file: disk changes appear in
 *            the editor, and edits autosave back to disk, which the game picks
 *            up. Best when you want to type on stage.
 *
 * One editor is kept per file once opened (hidden, not destroyed, when another
 * tab or Preview is showing), so a draft, an in-flight write, or a conflict
 * survives switching away and back.
 */
import { computed, nextTick, reactive, ref } from 'vue'
import { LIVE_FILES, type LiveFile } from '../demo/mario/liveSource'
import LiveEditor, { type EditorStatus } from './LiveEditor.vue'
import LiveSource from './LiveSource.vue'

const props = withDefaults(defineProps<{ file?: LiveFile; mode?: 'preview' | 'edit' }>(), {
  file: 'demo/mario/level.ts',
  mode: 'preview',
})

const file = ref<LiveFile>(props.file)
const mode = ref<'preview' | 'edit'>(props.mode)
const statuses = reactive<Partial<Record<LiveFile, EditorStatus>>>({})
const editors = ref<Record<string, InstanceType<typeof LiveEditor> | null>>({})
/** Files whose editor has been opened; they stay mounted. */
const opened = ref<LiveFile[]>(props.mode === 'edit' ? [props.file] : [])

const status = computed<EditorStatus>(() => statuses[file.value] ?? 'ready')

const statusLabel: Record<EditorStatus, string> = {
  ready: 'in sync',
  dirty: 'unsaved',
  saving: 'saving…',
  saved: 'saved',
  error: 'write failed',
  conflict: 'changed on disk',
}

function basename(f: string) {
  return f.split('/').pop()
}

/**
 * A draft whose fate is undecided (a conflict waiting for a choice, or a write
 * that failed and has not been retried) must stay visible: it blocks both
 * Preview and switching to another file. A write still in flight is fine.
 */
function undecided(s: EditorStatus | undefined) {
  return s === 'conflict' || s === 'error'
}
const blocked = computed(() => mode.value === 'edit' && undecided(status.value))
const blockedReason = computed(() =>
  status.value === 'conflict'
    ? 'Choose Load the file or Keep mine first'
    : 'The last save failed; fix it or press Cmd/Ctrl+S to retry',
)

function setMode(m: 'preview' | 'edit') {
  if (m === 'preview' && blocked.value) return
  if (m === 'edit' && !opened.value.includes(file.value)) opened.value.push(file.value)
  mode.value = m
  if (m === 'edit') {
    // Returning to an existing editor: focus it once it is visible again. A
    // new one focuses itself after Monaco loads (`autofocus`).
    nextTick(() => editors.value[file.value]?.focus())
  } else {
    // Hiding the editor writes any pending autosave now rather than after the debounce.
    editors.value[file.value]?.flush()
  }
}

function setFile(f: LiveFile) {
  if (f === file.value || blocked.value) return
  editors.value[file.value]?.flush()
  file.value = f
  if (mode.value === 'edit') {
    if (!opened.value.includes(f)) opened.value.push(f)
    nextTick(() => editors.value[f]?.focus())
  }
}

defineExpose({ setFile, setMode })
</script>

<template>
  <div class="lc-root">
    <div class="lc-bar">
      <span class="lc-dot" /><span class="lc-dot" /><span class="lc-dot" />

      <div class="lc-files" role="tablist" aria-label="File">
        <button
          v-for="f in LIVE_FILES"
          :key="f"
          type="button"
          role="tab"
          :aria-selected="f === file"
          :class="{ on: f === file, flag: f !== file && undecided(statuses[f]) }"
          :disabled="f !== file && blocked"
          :title="f !== file && blocked ? blockedReason : f"
          @click="setFile(f)"
        >
          {{ basename(f) }}
        </button>
      </div>

      <span v-if="mode === 'edit' || undecided(status)" class="lc-status" :class="status">{{ statusLabel[status] }}</span>
      <span v-else class="lc-status ready">● live</span>

      <div class="lc-toggle" role="tablist" aria-label="Code panel mode">
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'preview'"
          :class="{ on: mode === 'preview' }"
          :disabled="blocked"
          :title="blocked ? blockedReason : undefined"
          @click="setMode('preview')"
        >
          Preview
        </button>
        <button type="button" role="tab" :aria-selected="mode === 'edit'" :class="{ on: mode === 'edit' }" @click="setMode('edit')">
          Edit
        </button>
      </div>
    </div>

    <div class="lc-body">
      <LiveSource v-if="mode === 'preview'" :file="file" bare />
      <LiveEditor
        v-for="f in opened"
        v-show="mode === 'edit' && f === file"
        :key="f"
        :ref="(el) => (editors[f] = el as any)"
        :file="f"
        autofocus
        @status="statuses[f] = $event"
      />
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
.lc-files {
  display: inline-flex;
  gap: 0.15rem;
  margin-left: 0.5rem;
}
.lc-files button {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #6c757d;
  font: inherit;
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
}
.lc-files button.on {
  color: #212529;
  font-weight: 700;
  border-bottom-color: #a51c30;
}
.lc-files button.flag::after {
  content: ' ●';
  color: #dc3545;
}
.lc-files button:disabled {
  cursor: not-allowed;
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
.lc-toggle button:disabled {
  color: #adb5bd;
  cursor: not-allowed;
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
