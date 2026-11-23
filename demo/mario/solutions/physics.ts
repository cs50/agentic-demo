/**
 * physics.ts — what happens to the duck between frames. THIS file is edited live.
 *
 * The engine calls applyGravity() sixty times a second with the duck's
 * vertical speed (pixels per frame, negative is up) and uses what it returns.
 *
 * Gravity adds a constant to the speed every frame, so the duck accelerates
 * downward until it either lands or reaches terminal velocity.
 */

/** The speed a jump starts with, in pixels per frame. Negative is up. */
export const JUMP_VELOCITY = -14

/** Added to the vertical speed every frame, in pixels per frame². */
export const GRAVITY = 0.8

/** Terminal velocity, so a long fall cannot tunnel through a tile. */
export const MAX_FALL = 16

export function applyGravity(vy: number): number {
  return Math.min(vy + GRAVITY, MAX_FALL)
}
