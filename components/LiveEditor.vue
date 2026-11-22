<script setup lang="ts">
/**
 * LiveEditor — a Monaco editor bound two ways to demo/mario/level.ts.
 *
 *   disk  → editor   `levelSource` (an HMR-fed ref, see liveSource.ts) changes
 *                    whenever the file changes on disk, e.g. when the agent
 *                    saves it. If the editor has no unsaved edits, the new text
 *                    is applied in place. If it does, a conflict bar lets the
 *                    presenter choose.
 *   editor → disk    Edits are autosaved (debounced) or saved with Cmd/Ctrl+S,
 *                    through a dev-server channel that writes only this file
 *                    (see vite.config.ts). The write triggers HMR, so the game
 *                    rebuilds the level, and `levelSource` echoes the save back.
 *
 * Slidev's Monaco setup already disables slide shortcuts while the editor has
 * focus, so typing Space or arrows doesn't change slides.
 */
import type * as Monaco from 'monaco-editor'
import { useSlideContext } from '@slidev/client'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  acceptExternal,
  initialSyncState,
  isDirty as syncIsDirty,
  keepLocal,
  markSent,
  reconcile,
  rollbackFailedWrite,
  type SyncState,
} from '../demo/mario/editorSync'
import { levelSource } from '../demo/mario/liveSource'

const props = withDefaults(
  defineProps<{ autosave?: boolean; autosaveDelay?: number; autofocus?: boolean; writeTimeout?: number }>(),
  {
    autosave: true,
    autosaveDelay: 600,
    autofocus: false,
    /** How long to wait for the dev server to answer a write before treating it as failed. */
    writeTimeout: 3000,
  },
)
const emit = defineEmits<{ (e: 'status', s: EditorStatus): void }>()

export type EditorStatus = 'ready' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict'

const { $renderContext } = useSlideContext()
const isLive = ['slide', 'presenter'].includes($renderContext.value)

const container = ref<HTMLDivElement | null>(null)
const status = ref<EditorStatus>('ready')
const errorMessage = ref<string | null>(null)
/** Disk content that arrived while the editor had unsaved edits. */
const pendingExternal = ref<string | null>(null)

let monaco: typeof Monaco | null = null
let editor: Monaco.editor.IStandaloneCodeEditor | null = null
let model: Monaco.editor.ITextModel | null = null
/** What the editor believes about the file on disk; see editorSync.ts. */
let sync: SyncState = initialSyncState(levelSource.value)
let saveTimer = 0
let writeTimer = 0
let offResult: (() => void) | null = null

function setStatus(s: EditorStatus) {
  status.value = s
  emit('status', s)
}

function isDirty() {
  return !!model && syncIsDirty(sync, model.getValue())
}

/**
 * The dev server refused a write, or never answered: roll the sync state back
 * so the editor is dirty again and the next keystroke or Cmd+S re-sends it.
 * (No automatic retry loop: if the file is unwritable, retrying every 600 ms
 * would only hammer the server.)
 */
function failWrite(message: string) {
  clearTimeout(writeTimer)
  sync = rollbackFailedWrite(sync)
  errorMessage.value = message
  setStatus('error')
}

/** Replace the whole document while keeping the undo stack and cursor sane. */
function applyText(text: string) {
  if (!model || !editor) return
  const selection = editor.getSelection()
  model.pushEditOperations(
    selection ? [selection] : [],
    [{ range: model.getFullModelRange(), text }],
    () => (selection ? [selection] : null),
  )
}

function save(force = false) {
  if (!model || !import.meta.hot) return
  // While a disk change is waiting for a decision, only an explicit choice
  // ("Keep mine", or Cmd+S) may write; a pending autosave must not win by default.
  if (pendingExternal.value !== null && !force) return
  const content = model.getValue()
  if (!syncIsDirty(sync, content)) {
    // Nothing new to write. Keep 'saving' (a write is in flight) and 'error'
    // (the last write failed) visible rather than claiming to be in sync.
    if (status.value !== 'error' && status.value !== 'saving') setStatus('ready')
    return
  }
  setStatus('saving')
  import.meta.hot.send('lecture:write-level', { content })
  // Optimistic: the HMR echo via levelSource confirms the write; the result
  // event (or the timeout below, if the socket swallowed the send) reports failure.
  sync = markSent(sync, content)
  clearTimeout(writeTimer)
  writeTimer = window.setTimeout(() => failWrite('no response from dev server'), props.writeTimeout)
}

function scheduleSave() {
  clearTimeout(saveTimer)
  if (!props.autosave) return
  saveTimer = window.setTimeout(() => save(), props.autosaveDelay)
}

/** Disk changed while we had unsaved edits: take the disk version. */
function loadExternal() {
  if (pendingExternal.value === null) return
  clearTimeout(saveTimer)
  applyText(pendingExternal.value)
  sync = acceptExternal(pendingExternal.value)
  pendingExternal.value = null
  setStatus('ready')
}

/** Disk changed while we had unsaved edits: keep ours and write it back. */
function keepMine() {
  if (pendingExternal.value === null) return
  clearTimeout(saveTimer)
  // Disk now holds the other version; measure our text against *that*, so an
  // undo back to the old text still counts as different and gets written.
  sync = keepLocal(sync, pendingExternal.value)
  pendingExternal.value = null
  save(true)
}

// disk → editor
watch(levelSource, (disk) => {
  if (!model) {
    sync = initialSyncState(disk)
    return
  }
  const { state, result } = reconcile(sync, disk, model.getValue())
  sync = state
  switch (result.kind) {
    case 'echo':
      // Our own write came back. If the presenter kept typing meanwhile, the
      // editor is simply dirty again (its autosave is already scheduled); it is
      // not a conflict.
      if (sync.inflight.length === 0) clearTimeout(writeTimer)
      errorMessage.value = null
      setStatus(result.dirty ? 'dirty' : 'saved')
      return
    case 'identical':
      clearTimeout(writeTimer)
      pendingExternal.value = null
      setStatus(status.value === 'saving' ? 'saved' : 'ready')
      return
    case 'apply':
      applyText(disk)
      setStatus('ready')
      return
    case 'conflict':
      // Someone else (the agent) changed the file under our unsaved edits.
      pendingExternal.value = disk
      setStatus('conflict')
      return
  }
})

onMounted(async () => {
  if (!isLive || !container.value) return

  // Explicit extension: the package's wildcard export doesn't add it, and
  // Vite would otherwise treat the extensionless URL as a page route.
  const { default: setup } = await import('@slidev/client/setup/monaco.ts')
  const result = await setup()
  monaco = result.monaco
  if (!container.value) return // unmounted while loading

  model = monaco.editor.createModel(
    levelSource.value,
    'typescript',
    monaco.Uri.parse('file:///demo/mario/level.ts'),
  )
  sync = initialSyncState(levelSource.value)

  editor = monaco.editor.create(container.value, {
    model,
    automaticLayout: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    lineDecorationsWidth: 0,
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    fontSize: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontLigatures: false,
    tabSize: 2,
    padding: { top: 8, bottom: 8 },
    wordWrap: 'off',
    ...result.editorOptions,
  })

  model.onDidChangeContent(() => {
    if (pendingExternal.value !== null) return // keep showing the conflict bar
    if (isDirty()) {
      setStatus('dirty')
      scheduleSave()
    } else {
      clearTimeout(saveTimer)
      setStatus('ready')
    }
  })

  editor.addAction({
    id: 'lecture-save-level',
    label: 'Save level.ts',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: () => {
      clearTimeout(saveTimer)
      save(true) // Cmd+S is an explicit choice, even during a conflict
    },
  })

  if (import.meta.hot) {
    const onResult = (r: { ok: boolean; error?: string }) => {
      if (r.ok) {
        errorMessage.value = null
        // 'saved' is set when the HMR echo arrives; nothing to do here.
      } else {
        failWrite(r.error ?? 'write failed')
      }
    }
    import.meta.hot.on('lecture:write-level:result', onResult)
    offResult = () => import.meta.hot?.off('lecture:write-level:result', onResult)
  }

  setStatus('ready')
  // Focus only once the editor exists; a parent calling focus() right after
  // mounting would run before the async Monaco setup above has finished.
  if (props.autofocus) editor.focus()
  // Expose for on-stage diagnostics (e.g. from DevTools): window.__levelEditor.getValue()
  if (import.meta.env.DEV) (window as any).__levelEditor = editor
})

/**
 * Slidev locks its shortcuts on Monaco *widget* focus, which is reliable in a
 * normal browser window. As a belt-and-braces measure (the canvas does the same),
 * keep keystrokes that originate inside the editor from reaching Slidev's
 * window-level handler at all, so Space and arrows never change slides mid-edit.
 */
function trapKeys(e: KeyboardEvent) {
  e.stopPropagation()
}

onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  // Leaving Edit mode (e.g. switching to Preview) must not drop a pending
  // autosave. The send is fire-and-forget, so it is safe during teardown. A
  // conflict is never flushed silently; LiveCode keeps the editor open until
  // the presenter has chosen.
  if (model && pendingExternal.value === null && isDirty()) save(true)
  clearTimeout(writeTimer) // nobody is left to show a failure to
  offResult?.()
  editor?.dispose()
  model?.dispose()
  editor = null
  model = null
  if (import.meta.env.DEV) delete (window as any).__levelEditor
})

defineExpose({ focus: () => editor?.focus(), save, isDirty })
</script>

<template>
  <div class="le-root">
    <div v-if="pendingExternal !== null" class="le-conflict">
      <span><b>level.ts</b> changed on disk while you had unsaved edits.</span>
      <button type="button" @click="loadExternal">Load the file</button>
      <button type="button" class="secondary" @click="keepMine">Keep mine</button>
    </div>
    <div v-if="errorMessage" class="le-error">{{ errorMessage }}</div>
    <div ref="container" class="le-editor" @keydown="trapKeys" @keyup="trapKeys" @keypress="trapKeys" />
  </div>
</template>

<style scoped>
.le-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.le-editor {
  flex: 1;
  min-height: 0;
}
.le-conflict,
.le-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.7rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.72rem;
  line-height: 1.3;
}
.le-conflict {
  background: #fff3cd; /* Bootstrap alert-warning */
  border-bottom: 1px solid #ffe69c;
  color: #664d03;
}
.le-error {
  background: #f8d7da; /* Bootstrap alert-danger */
  border-bottom: 1px solid #f1aeb5;
  color: #58151c;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.le-conflict button {
  margin-left: auto;
  border: 1px solid #a51c30;
  background: #a51c30;
  color: #fff;
  border-radius: 4px;
  padding: 0.15rem 0.55rem;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}
.le-conflict button.secondary {
  margin-left: 0;
  background: transparent;
  color: #a51c30;
}
</style>
