/**
 * sloppyclaude.ts — the Gym Leader's one monster.
 *
 * Drawn after the reference sheet: a flat terracotta block, two square
 * eyes, a stub arm on each side, four legs. 24×16 pixels (the reference's
 * 12×8 grid doubled, so the eyes can carry an expression). Flat, no outline,
 * as in the reference. It is confident, friendly, and wrong.
 *
 * Frames: idle, bounce (body up, legs stretched), hurt (eyes shut, crouched).
 */

import type { Sprite } from './sprites'

export const SLOPPYCLAUDE_NAME = 'Sloppyclaude'

const PALETTE: Record<string, string> = {
  O: '#d97757', // body
  o: '#c4674a', // underside shade
  K: '#182028', // eyes
}

const IDLE = [
  '....OOOOOOOOOOOOOOOO....',
  '....OOOOOOOOOOOOOOOO....',
  '....OOKKOOOOOOOOKKOO....',
  '....OOKKOOOOOOOOKKOO....',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  '....OOOOOOOOOOOOOOOO....',
  '....OOOOOOOOOOOOOOOO....',
  '....ooOOooOOooOOooOO....',
  '....ooOOooOOooOOooOO....',
  '....OO..OO....OO..OO....',
  '....OO..OO....OO..OO....',
  '....oo..oo....oo..oo....',
  '....oo..oo....oo..oo....',
]

/** Bounce: the body lifts two pixels and the legs stretch to follow. */
const BOUNCE = [
  '....OOOOOOOOOOOOOOOO....',
  '....OOKKOOOOOOOOKKOO....',
  '....OOKKOOOOOOOOKKOO....',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  '....OOOOOOOOOOOOOOOO....',
  '....ooOOooOOooOOooOO....',
  '....OO..OO....OO..OO....',
  '....OO..OO....OO..OO....',
  '....OO..OO....OO..OO....',
  '....OO..OO....OO..OO....',
  '....oo..oo....oo..oo....',
  '....oo..oo....oo..oo....',
  '........................',
]

/** Hurt: eyes squeezed shut, body down on its legs. */
const HURT = [
  '........................',
  '........................',
  '....OOOOOOOOOOOOOOOO....',
  '....OOOOOOOOOOOOOOOO....',
  '....OKKKKOOOOOOKKKKO....',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  '....OOOOOOOOOOOOOOOO....',
  '....OOOOOOOOOOOOOOOO....',
  '....ooOOooOOooOOooOO....',
  '....ooOOooOOooOOooOO....',
  '....OO..OO....OO..OO....',
  '....oo..oo....oo..oo....',
  '....oo..oo....oo..oo....',
]

export const SLOPPYCLAUDE: Record<'idleA' | 'idleB' | 'hurt', Sprite> = {
  idleA: { rows: IDLE, palette: PALETTE },
  idleB: { rows: BOUNCE, palette: PALETTE },
  hurt: { rows: HURT, palette: PALETTE },
}

export const SLOPPYCLAUDE_W = 24
export const SLOPPYCLAUDE_H = 16
