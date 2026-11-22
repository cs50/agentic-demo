/**
 * liveLevel.ts — HMR bridge between level.ts and the running game.
 *
 * This module is the Vite hot-update boundary for level.ts. When the agent
 * saves level.ts, Vite re-evaluates it and calls our callback with the new
 * module. We rebuild the world and notify subscribers (the running engine),
 * so the level changes under the player without remounting anything.
 *
 * If the new level.ts throws, we keep the previous world and surface the
 * error so the presenter can show the agent fixing it. If it doesn't even
 * compile, Vite reports that as `vite:error`, which we surface the same way.
 */

import { buildWorld, type World } from './world'

export interface LevelUpdate {
  world: World
  source: string | null
  error: string | null
}

type Listener = (update: LevelUpdate) => void

const listeners = new Set<Listener>()

// Start from a safe fallback (ground only). The real level is loaded below.
let current: LevelUpdate = { world: buildWorld([]), source: null, error: null }

function safeBuild(fn: () => string[]): LevelUpdate {
  try {
    return { world: buildWorld(fn()), source: null, error: null }
  } catch (e) {
    return {
      world: current.world,
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

/** Turn esbuild's multi-line transform error into one readable line. */
function describeTransformError(err: any): string {
  const where = err?.loc ? ` (line ${err.loc.line}, column ${err.loc.column})` : ''
  // esbuild's message is "Transform failed with 1 error:\n<file>:<line>:<col>: ERROR: <reason>".
  const raw: string = err?.message ?? 'syntax error'
  const reason = raw.split('\n').map((l: string) => l.replace(/^.*?ERROR:\s*/, '').trim())
    .find((l: string) => l && !/^Transform failed/.test(l)) ?? raw.split('\n')[0]
  return `SyntaxError${where}: ${reason}`
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

  // A *syntax* error never reaches the accept callback above: Vite fails to
  // transform the module and reports it as `vite:error` instead. Surface it in
  // the same error strip, keeping the previous world, so the presenter (and the
  // agent) can see what to fix. The HMR overlay is disabled in vite.config.ts.
  // Registered before the first import below so a cold load with a broken file
  // also gets the real reason rather than a generic "failed to fetch".
  import.meta.hot.on('vite:error', (payload: any) => {
    const err = payload?.err
    const file: string = err?.id ?? err?.loc?.file ?? ''
    if (!file.includes('demo/mario/level.ts')) return
    publish({ ...current, error: describeTransformError(err) })
  })
}

/**
 * level.ts is imported dynamically on purpose: a static import of a file with
 * a syntax error would fail this whole module graph, and the game slide would
 * come up blank if the deck were refreshed mid-demo. A dynamic import fails
 * on its own, we keep the fallback world, and Vite's `vite:error` event (above)
 * carries the message to the error strip.
 */
export const levelReady: Promise<void> = import('./level')
  .then((mod) => {
    publish(safeBuild(() => mod.buildLevel()))
  })
  .catch((e) => {
    // If vite:error already supplied the reason, keep it; otherwise use the import error.
    if (current.error) return
    publish({ ...current, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) })
  })
