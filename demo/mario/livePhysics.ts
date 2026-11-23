/**
 * livePhysics.ts — HMR bridge between physics.ts and the running game.
 *
 * Sibling of liveLevel.ts. When physics.ts is saved, the new module is
 * checked (does applyGravity exist, does it return a number?) and handed to
 * the running engine. A broken file keeps the previous physics and says why.
 */

import type { Physics } from './engine'
import { createLive, describeError, type LiveUpdate } from './liveModule'

export type PhysicsUpdate = LiveUpdate<Physics>

/** Used until physics.ts loads, and kept if it never does: a jump, and nothing after it. */
const FALLBACK: Physics = { applyGravity: (vy) => vy, jumpVelocity: -14 }

const live = createLive<Physics>(FALLBACK)

export const currentPhysics = live.current
export const onPhysicsChange = live.onChange

/** Pull a Physics out of whatever the module exports, or throw a readable reason. */
export function adaptPhysics(mod: Record<string, unknown>): Physics {
  const fn = mod.applyGravity
  if (typeof fn !== 'function') throw new TypeError('physics.ts must export applyGravity(vy: number): number')
  const probe = fn(0)
  if (typeof probe !== 'number' || !Number.isFinite(probe)) {
    throw new TypeError(`applyGravity(0) returned ${String(probe)}, not a number`)
  }
  const jv = mod.JUMP_VELOCITY
  const jumpVelocity = typeof jv === 'number' && Number.isFinite(jv) ? jv : FALLBACK.jumpVelocity
  return { applyGravity: fn as Physics['applyGravity'], jumpVelocity }
}

function apply(mod: Record<string, unknown> | undefined) {
  if (!mod) return
  live.tryPublish(() => adaptPhysics(mod))
}

if (import.meta.hot) {
  import.meta.hot.accept('./physics', apply)
  live.watchTransformErrors('demo/mario/physics.ts')
}

/** Dynamic import, for the same reason as in liveLevel.ts. */
export const physicsReady: Promise<void> = import('./physics')
  .then(apply)
  .catch((e) => {
    if (!live.current().error) live.fail(describeError(e))
  })
