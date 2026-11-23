/**
 * physics.ts — what happens to the duck between frames. THIS file is edited live.
 *
 * The engine calls applyGravity() sixty times a second with the duck's
 * vertical speed (pixels per frame, negative is up) and uses what it returns.
 *
 * The room chose: Jupiter. Two and a half times Earth's pull. The jump speed
 * is the same, so the duck barely leaves the ground, and comes back fast.
 */

/** The speed a jump starts with, in pixels per frame. Negative is up. */
export const JUMP_VELOCITY = -14

/** Added to the vertical speed every frame, in pixels per frame². */
export const GRAVITY = 0.8 * 2.5

/** Terminal velocity, so a long fall cannot tunnel through a tile. */
export const MAX_FALL = 16

export function applyGravity(vy: number): number {
  return Math.min(vy + GRAVITY, MAX_FALL)
}
