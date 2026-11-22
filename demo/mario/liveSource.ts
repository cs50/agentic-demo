/**
 * liveSource.ts — keeps the *text* of level.ts in a reactive ref so the slide
 * can show (and animate) the code the agent is editing.
 *
 * Sibling of liveLevel.ts: that one tracks the module's behaviour, this one
 * tracks its source. Both are HMR boundaries for level.ts, so a single save
 * updates the game and the code view together, with no component remount.
 */

import { ref } from 'vue'
import source from './level.ts?raw'

export const levelSource = ref<string>(source)

if (import.meta.hot) {
  import.meta.hot.accept('./level.ts?raw', (mod) => {
    if (mod && typeof mod.default === 'string') levelSource.value = mod.default
  })
}
