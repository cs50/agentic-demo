/**
 * liveLevel.ts — HMR bridge between level.ts and the running game.
 *
 * This module is the Vite hot-update boundary for level.ts. When level.ts is
 * saved, Vite re-evaluates it and calls our callback with the new module. We
 * rebuild the world and notify subscribers (the running engine), so the level
 * changes under the player without remounting anything.
 *
 * If the new level.ts throws, we keep the previous world and surface the
 * error so the presenter can show the agent fixing it. If it doesn't even
 * compile, Vite reports that as `vite:error`, which we surface the same way.
 */

import { createLive, describeError, type LiveUpdate } from './liveModule'
import { buildWorld, type World } from './world'

export type LevelUpdate = LiveUpdate<World>

// Start from a safe fallback (ground only). The real level is loaded below.
const live = createLive<World>(buildWorld([]))

export const currentLevel = live.current
export const onLevelChange = live.onChange

function apply(mod: Record<string, unknown> | undefined) {
  if (!mod) return
  const build = mod.buildLevel
  if (typeof build !== 'function') {
    live.fail('level.ts must export buildLevel(): string[]')
    return
  }
  live.tryPublish(() => {
    const rows = build()
    if (!Array.isArray(rows) || rows.some((r) => typeof r !== 'string')) {
      throw new TypeError('buildLevel() must return string[]')
    }
    return buildWorld(rows)
  })
}

if (import.meta.hot) {
  import.meta.hot.accept('./level', apply)
  // Registered before the first import below so a cold load with a broken file
  // also gets the real reason rather than a generic "failed to fetch".
  live.watchTransformErrors('demo/mario/level.ts')
}

/**
 * level.ts is imported dynamically on purpose: a static import of a file with
 * a syntax error would fail this whole module graph, and the game slide would
 * come up blank if the deck were refreshed mid-demo. A dynamic import fails
 * on its own, we keep the fallback world, and Vite's `vite:error` event (above)
 * carries the message to the error strip.
 */
export const levelReady: Promise<void> = import('./level')
  .then(apply)
  .catch((e) => {
    // If vite:error already supplied the reason, keep it; otherwise use the import error.
    if (!live.current().error) live.fail(describeError(e))
  })
