/**
 * presets.ts — ready-made versions of the live files, for "the room decides".
 *
 * Each file in presets/ is a complete level.ts or physics.ts. The name says
 * which: `level-*.ts` replaces demo/mario/level.ts, `physics-*.ts` replaces
 * demo/mario/physics.ts. A slide offers a few by name (see GameChoice.vue);
 * when the vote closes, the winner is written over the live file through the
 * dev server, the same path the editor and the agent use, and the running
 * game picks it up via HMR.
 *
 * Adding a choice is adding a file here. Keep the exports the engine expects
 * (buildLevel(); applyGravity() and JUMP_VELOCITY), as tests/presets.test.ts
 * checks.
 */

import { LIVE_FILES, type LiveFile } from './liveSource'

/** Preset name (file stem) -> source text. Bundled at build time. */
const sources = import.meta.glob('./presets/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const PRESETS: Record<string, string> = Object.fromEntries(
  Object.entries(sources).map(([path, text]) => [path.replace(/^.*\//, '').replace(/\.ts$/, ''), text]),
)

export function presetNames(): string[] {
  return Object.keys(PRESETS).sort()
}

/** Which live file a preset replaces, from its name. */
export function targetOf(preset: string): LiveFile | null {
  const kind = preset.split('-')[0]
  return LIVE_FILES.find((f) => f.endsWith(`/${kind}.ts`)) ?? null
}

export interface WriteResult {
  ok: boolean
  error?: string
}

/**
 * Write a preset over its live file via the dev server (vite.config.ts,
 * `lecture:write-file`). Resolves with the server's verdict. Only works under
 * `pnpm dev` on the presenter's machine; anywhere else it resolves with an error.
 */
export function applyPreset(preset: string): Promise<WriteResult> {
  const content = PRESETS[preset]
  const file = targetOf(preset)
  if (content === undefined) return Promise.resolve({ ok: false, error: `no preset named ${preset}` })
  if (!file) return Promise.resolve({ ok: false, error: `${preset} does not name a live file` })
  const hot = import.meta.hot
  if (!hot) return Promise.resolve({ ok: false, error: 'writing needs the dev server (pnpm dev)' })

  return new Promise((resolve) => {
    const onResult = (r: { file?: string; ok?: boolean; error?: string }) => {
      if (r?.file !== file) return
      hot.off('lecture:write-file:result', onResult)
      clearTimeout(timer)
      resolve({ ok: !!r.ok, error: r.error })
    }
    const timer = setTimeout(() => {
      hot.off('lecture:write-file:result', onResult)
      resolve({ ok: false, error: 'no answer from the dev server' })
    }, 5000)
    hot.on('lecture:write-file:result', onResult)
    hot.send('lecture:write-file', { file, content })
  })
}
