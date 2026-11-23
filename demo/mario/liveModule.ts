/**
 * liveModule.ts — the bookkeeping shared by the HMR boundaries (liveLevel.ts,
 * livePhysics.ts): a current value, subscribers, and "keep the previous value
 * and say why" when a new version of the file is unusable.
 *
 * Each boundary still owns its own `import.meta.hot.accept(...)` calls, since
 * Vite needs to see the file paths as literals.
 */

import { describeTransformError } from './transformError'

export interface LiveUpdate<T> {
  value: T
  /** Why the latest file could not be used; the value is then the previous one. */
  error: string | null
}

export interface Live<T> {
  current(): LiveUpdate<T>
  onChange(fn: (u: LiveUpdate<T>) => void): () => void
  /** Try `fn`; on success publish its result, on failure keep the value and publish the error. */
  tryPublish(fn: () => T): void
  /** Keep the current value, publish this error. */
  fail(error: string): void
  /**
   * Route Vite's `vite:error` (a syntax error never reaches an accept callback;
   * Vite fails to transform the module and reports it this way instead) for one
   * file into the same error channel. The HMR overlay is off in vite.config.ts.
   */
  watchTransformErrors(fileSuffix: string): void
}

export function describeError(e: unknown): string {
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e)
}

export function createLive<T>(fallback: T): Live<T> {
  const listeners = new Set<(u: LiveUpdate<T>) => void>()
  let current: LiveUpdate<T> = { value: fallback, error: null }

  function publish(update: LiveUpdate<T>) {
    current = update
    for (const fn of listeners) fn(update)
  }

  return {
    current: () => current,
    onChange(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    tryPublish(fn) {
      try {
        publish({ value: fn(), error: null })
      } catch (e) {
        publish({ value: current.value, error: describeError(e) })
      }
    },
    fail(error) {
      publish({ value: current.value, error })
    },
    watchTransformErrors(fileSuffix) {
      import.meta.hot?.on('vite:error', (payload: any) => {
        const err = payload?.err
        const file: string = err?.id ?? err?.loc?.file ?? ''
        if (!file.endsWith(fileSuffix)) return
        publish({ value: current.value, error: describeTransformError(err) })
      })
    },
  }
}
