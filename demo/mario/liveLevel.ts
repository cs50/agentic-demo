/**
 * liveLevel.ts — HMR bridge between level.ts and the running game.
 *
 * This module is the Vite hot-update boundary for level.ts. When the agent
 * saves level.ts, Vite re-evaluates it and calls our callback with the new
 * module. We rebuild the world and notify subscribers (the running engine),
 * so the level changes under the player without remounting anything.
 *
 * If the new level.ts throws, we keep the previous world and surface the
 * error so the presenter can show the agent fixing it.
 */

import { buildLevel } from './level'
import { buildWorld, type World } from './world'

export interface LevelUpdate {
  world: World
  source: string | null
  error: string | null
}

type Listener = (update: LevelUpdate) => void

const listeners = new Set<Listener>()

let current: LevelUpdate = safeBuild(() => buildLevel())

function safeBuild(fn: () => string[]): LevelUpdate {
  try {
    return { world: buildWorld(fn()), source: null, error: null }
  } catch (e) {
    return {
      world: current?.world ?? buildWorld([]),
      source: null,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    }
  }
}

export function currentLevel(): LevelUpdate {
  return current
}

export function onLevelChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function publish(update: LevelUpdate) {
  current = update
  for (const fn of listeners) fn(update)
}

if (import.meta.hot) {
  import.meta.hot.accept('./level', (mod) => {
    if (!mod) return
    if (typeof mod.buildLevel !== 'function') {
      publish({ ...current, error: 'level.ts must export buildLevel(): string[]' })
      return
    }
    publish(safeBuild(() => mod.buildLevel()))
  })
}
