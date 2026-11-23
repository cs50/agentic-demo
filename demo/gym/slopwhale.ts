/**
 * slopwhale.ts — the Gym Leader's one monster.
 *
 * An original creature that owes something to two mascots: the stout orange
 * block body, dot eyes and stubby legs of Claude Code's terminal mascot, and
 * the plump blue whale of DeepSeek's mark, whose tail fluke ends in a text
 * cursor. It is confident, friendly, and wrong. 28×22 pixels.
 *
 * Frames: idle (two, for breathing), hurt (X eyes), and the cursor on the
 * tail blinks on its own.
 */

import type { Sprite } from './sprites'

export const SLOPWHALE_NAME = 'Slopwhale'

const PALETTE: Record<string, string> = {
  O: '#d97757', // body
  o: '#b85f41', // body shade
  B: '#4d6bfe', // whale belly
  b: '#3a52c9', // belly shade
  K: '#212529', // eyes
  W: '#ffffff', // eye shine, cursor
  C: '#212529', // cursor
  X: '#a51c30', // hurt
}

const IDLE_A = [
  '......OOOOOOOOOOOOOO........',
  '....OOOOOOOOOOOOOOOOOO......',
  '...OOOOOOOOOOOOOOOOOOOO.....',
  '..OOOOKKOOOOOOOOOOKKOOOO....',
  '..OOOOKWOOOOOOOOOOKWOOOO....',
  '..OOOOOOOOOOOOOOOOOOOOOO....',
  '..OOOOOOOOOOOOOOOOOOOOOO....',
  '..OOOOOOOOOOOOOOOOOOOOOOO...',
  '..OOOOOOOOOOOOOOOOOOOOOOOO..',
  '..oOOOOOOOOOOOOOOOOOOOOOOOO.',
  '..oooOOOOOOOOOOOOOOOOOOOOOOO',
  '..BBBBBBBBBBBBBBBBBBBBBBBOOO',
  '..BBBBBBBBBBBBBBBBBBBBBBBBOO',
  '...BBBBBBBBBBBBBBBBBBBBBBBB.',
  '....bBBBBBBBBBBBBBBBBBBBbb..',
  '.....bbBBBBBBBBBBBBBBBbb....',
  '.......bbbBBBBBBBBBbbb......',
  '..........bbbbbbbbb....BB...',
  '....OO...OO.......OO..BBBB..',
  '....OO...OO.......OO.BBBBBB.',
  '....oo...oo.......oo...CC...',
  '.......................CC...',
]

/** Breathing: the body one row lower, legs the same. */
const IDLE_B = [
  '............................',
  '......OOOOOOOOOOOOOO........',
  '....OOOOOOOOOOOOOOOOOO......',
  '...OOOOOOOOOOOOOOOOOOOO.....',
  '..OOOOKKOOOOOOOOOOKKOOOO....',
  '..OOOOKWOOOOOOOOOOKWOOOO....',
  '..OOOOOOOOOOOOOOOOOOOOOO....',
  '..OOOOOOOOOOOOOOOOOOOOOO....',
  '..OOOOOOOOOOOOOOOOOOOOOOO...',
  '..OOOOOOOOOOOOOOOOOOOOOOOO..',
  '..oOOOOOOOOOOOOOOOOOOOOOOOO.',
  '..oooOOOOOOOOOOOOOOOOOOOOOOO',
  '..BBBBBBBBBBBBBBBBBBBBBBBOOO',
  '..BBBBBBBBBBBBBBBBBBBBBBBBOO',
  '...BBBBBBBBBBBBBBBBBBBBBBBB.',
  '....bBBBBBBBBBBBBBBBBBBBbb..',
  '.....bbBBBBBBBBBBBBBBBbb....',
  '.......bbbBBBBBBBBBbbb.BB...',
  '....OO...OO.......OO..BBBB..',
  '....OO...OO.......OO.BBBBBB.',
  '....oo...oo.......oo...CC...',
  '.......................CC...',
]

const HURT = IDLE_A.map((row, r) => {
  if (r === 3) return '..OOOXOXOOOOOOOOOOXOXOOO....'
  if (r === 4) return '..OOOOXOOOOOOOOOOOOXOOOO....'
  if (r === 5) return '..OOOXOXOOOOOOOOOOXOXOOO....'
  return row
})

export const SLOPWHALE: Record<'idleA' | 'idleB' | 'hurt', Sprite> = {
  idleA: { rows: IDLE_A, palette: PALETTE },
  idleB: { rows: IDLE_B, palette: PALETTE },
  hurt: { rows: HURT, palette: PALETTE },
}

/** With the cursor hidden, for the blink. */
export const CURSOR_OFF: Record<string, string> = { C: 'rgba(0,0,0,0)' }
