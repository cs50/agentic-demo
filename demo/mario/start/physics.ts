/**
 * physics.ts — what happens to the duck between frames. THIS file is edited live.
 *
 * The engine calls applyGravity() sixty times a second with the duck's
 * vertical speed (pixels per frame, negative is up) and uses what it returns.
 *
 * Right now nothing pulls the duck back down: a jump gives it an upward speed,
 * and it keeps it.
 */

/** The speed a jump starts with, in pixels per frame. Negative is up. */
export const JUMP_VELOCITY = -14

export function applyGravity(vy: number): number {
  return vy
}
