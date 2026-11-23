/**
 * liveSource.ts — keeps the *text* of each live file in a reactive ref so the
 * slide can show (and animate) the code being edited.
 *
 * Sibling of liveLevel.ts / livePhysics.ts: those track the modules'
 * behaviour, this one tracks their source. All are HMR boundaries, so a single
 * save updates the game and the code view together, with no component remount.
 */

import { ref, type Ref } from 'vue'
import levelText from './level.ts?raw'
import physicsText from './physics.ts?raw'

/** The files the code panel can show and the editor can write. Paths are repo-relative. */
export const LIVE_FILES = ['demo/mario/level.ts', 'demo/mario/physics.ts'] as const
export type LiveFile = (typeof LIVE_FILES)[number]

export function isLiveFile(file: string): file is LiveFile {
  return (LIVE_FILES as readonly string[]).includes(file)
}

const sources: Record<LiveFile, Ref<string>> = {
  'demo/mario/level.ts': ref(levelText),
  'demo/mario/physics.ts': ref(physicsText),
}

export function sourceOf(file: LiveFile): Ref<string> {
  return sources[file]
}

if (import.meta.hot) {
  import.meta.hot.accept('./level.ts?raw', (mod) => {
    if (mod && typeof mod.default === 'string') sources['demo/mario/level.ts'].value = mod.default
  })
  import.meta.hot.accept('./physics.ts?raw', (mod) => {
    if (mod && typeof mod.default === 'string') sources['demo/mario/physics.ts'].value = mod.default
  })
}
