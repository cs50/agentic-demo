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
import { levelSource } from '../demo/mario/liveSource'

const props = withDefaults(defineProps<{ autosave?: boolean; autosaveDelay?: number }>(), {
  autosave: true,
  autosaveDelay: 600,
})
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
/** The last text known to match the file on disk. */
let lastSynced = levelSource.value
let saveTimer = 0
let offResult: (() => void) | null = null

function setStatus(s: EditorStatus) {
  status.value = s
  emit('status', s)
}

function isDirty() {
  return !!model && model.getValue() !== lastSynced
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
  if (content === lastSynced) {
    setStatus('ready')
    return
  }
  setStatus('saving')
  import.meta.hot.send('lecture:write-level', { content })
  // Optimistic: the HMR echo via levelSource will confirm; the result event reports failures.
  lastSynced = content
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
  lastSynced = pendingExternal.value
  pendingExternal.value = null
  setStatus('ready')
}

/** Disk changed while we had unsaved edits: keep ours and write it back. */
function keepMine() {
  clearTimeout(saveTimer)
  pendingExternal.value = null
  save(true)
}

// disk → editor
watch(levelSource, (disk) => {
  if (!model) {
    lastSynced = disk
    return
  }
  const current = model.getValue()
  if (disk === current) {
    // Echo of our own save, or an identical write. We're in sync.
    lastSynced = disk
    pendingExternal.value = null
    setStatus(status.value === 'saving' ? 'saved' : 'ready')
    return
  }
  if (!isDirty()) {
    applyText(disk)
    lastSynced = disk
    setStatus('ready')
    return
  }
  // Someone else (the agent) changed the file under our unsaved edits.
  pendingExternal.value = disk
  setStatus('conflict')
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
  lastSynced = levelSource.value

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
        errorMessage.value = r.error ?? 'write failed'
        setStatus('error')
      }
    }
    import.meta.hot.on('lecture:write-level:result', onResult)
    offResult = () => import.meta.hot?.off('lecture:write-level:result', onResult)
  }

  setStatus('ready')
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
  offResult?.()
  editor?.dispose()
  model?.dispose()
  editor = null
  model = null
  if (import.meta.env.DEV) delete (window as any).__levelEditor
})

defineExpose({ focus: () => editor?.focus(), save })
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
