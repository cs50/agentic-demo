/**
 * sprites.ts — pixel-map sprites for the campus game.
 *
 * A sprite is rows of palette letters, as in demo/mario/duck.ts: '.' is
 * transparent, any other character looks up a colour. One drawing routine
 * renders any of them to a canvas at an integer scale, optionally mirrored.
 */

export interface Sprite {
  rows: string[]
  palette: Record<string, string>
}

export function spriteSize(s: Sprite) {
  return { w: s.rows[0].length, h: s.rows.length }
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  s: Sprite,
  x: number,
  y: number,
  scale = 1,
  flipX = false,
  override?: Record<string, string>,
) {
  const { w } = spriteSize(s)
  for (let r = 0; r < s.rows.length; r++) {
    const row = s.rows[r]
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]
      if (ch === '.') continue
      const fill = override?.[ch] ?? s.palette[ch]
      if (!fill) continue
      const cc = flipX ? w - 1 - c : c
      ctx.fillStyle = fill
      ctx.fillRect(x + cc * scale, y + r * scale, scale, scale)
    }
  }
}

// ------------------------------------------------------------------ the duck

import { DUCK_PALETTE, DUCK_ROWS } from '../mario/duck'

/** The duck as drawn in the Mario game (side view, facing right). */
export const DUCK_SIDE: Sprite = { rows: DUCK_ROWS, palette: DUCK_PALETTE }

/** The duck seen from behind, for the battle screen (we stand behind it). */
export const DUCK_BACK: Sprite = {
  palette: DUCK_PALETTE,
  rows: [
    '....DDDDDD....',
    '...DYYYYYYD...',
    '..DYYYYYYYYD..',
    '..DYYYYYYYYD..',
    '..DYYYYYYYYD..',
    '..DYYYYYYYYD..',
    '...DYYYYYYD...',
    '.DDDDYYYYDDDD.',
    'DYYYYYYYYYYYYD',
    'DYYYYYYYYYYYYD',
    '.DYYYYYYYYYYD.',
    '..DYYYYYYYYD..',
    '...DDYYYYDD...',
    '.....DDDD.....',
  ],
}

/**
 * The duck walking, top-down. Two frames per direction; `down` shows the beak
 * (facing the camera), `up` the back of the head. Left and right reuse the
 * side view, mirrored.
 */
const DUCK_DOWN_A: Sprite = {
  palette: DUCK_PALETTE,
  rows: [
    '....DDDDDD....',
    '...DYYYYYYD...',
    '..DYYYYYYYYD..',
    '..DYBWYYWBYD..',
    '..DYBBYYBBYD..',
    '..DYYOOOOYYD..',
    '...DYOOOOYD...',
    '.DDDDYYYYDDDD.',
    'DYYYYYYYYYYYYD',
    'DYYYYYYYYYYYYD',
    '.DYYYYYYYYYYD.',
    '..DYYYYYYYYD..',
    '...DDYYYYDD...',
    '....OO..OO....',
  ],
}
const DUCK_DOWN_B: Sprite = { ...DUCK_DOWN_A, rows: [...DUCK_DOWN_A.rows.slice(0, 13), '.....OO.OO....'] }
const DUCK_UP_A: Sprite = { ...DUCK_BACK, rows: [...DUCK_BACK.rows.slice(0, 13), '....OO..OO....'] }
const DUCK_UP_B: Sprite = { ...DUCK_BACK, rows: [...DUCK_BACK.rows.slice(0, 13), '.....OO.OO....'] }

export type Facing = 'up' | 'down' | 'left' | 'right'

/** Frame for a walking duck: `frame` alternates 0/1 while moving. */
export function duckWalk(facing: Facing, frame: 0 | 1): { sprite: Sprite; flipX: boolean } {
  switch (facing) {
    case 'down':
      return { sprite: frame ? DUCK_DOWN_B : DUCK_DOWN_A, flipX: false }
    case 'up':
      return { sprite: frame ? DUCK_UP_B : DUCK_UP_A, flipX: false }
    case 'right':
      return { sprite: DUCK_SIDE, flipX: false }
    case 'left':
      return { sprite: DUCK_SIDE, flipX: true }
  }
}

// ------------------------------------------------------------------- people

const PERSON_PALETTE: Record<string, string> = {
  H: '#4a3f1d', // hair
  F: '#f1c9a5', // face
  S: '#a51c30', // shirt (overridden per NPC)
  P: '#495057', // trousers
  K: '#212529', // shoes, eyes
  W: '#ffffff',
}

/** A 12×16 person facing the camera. Override 'S' and 'H' per character. */
export const PERSON: Sprite = {
  palette: PERSON_PALETTE,
  rows: [
    '....HHHH....',
    '...HHHHHH...',
    '...HFFFFH...',
    '...FKFFKF...',
    '...FFFFFF...',
    '....FFFF....',
    '...SSSSSS...',
    '..SSSSSSSS..',
    '..FSSSSSSF..',
    '..FSSSSSSF..',
    '...SSSSSS...',
    '...PPPPPP...',
    '...PPPPPP...',
    '...PP..PP...',
    '...PP..PP...',
    '...KK..KK...',
  ],
}

/** A person as seen from behind (talking to the duck above them). */
export const PERSON_BACK: Sprite = {
  palette: PERSON_PALETTE,
  rows: [
    '....HHHH....',
    '...HHHHHH...',
    '...HHHHHH...',
    '...HHHHHH...',
    '...FHHHHF...',
    '....FFFF....',
    '...SSSSSS...',
    '..SSSSSSSS..',
    '..FSSSSSSF..',
    '..FSSSSSSF..',
    '...SSSSSS...',
    '...PPPPPP...',
    '...PPPPPP...',
    '...PP..PP...',
    '...PP..PP...',
    '...KK..KK...',
  ],
}

// ------------------------------------------------------------ John Harvard

/** The statue: a seated bronze figure on a granite plinth, 16×24, drawn as one sprite over two tiles. */
export const STATUE: Sprite = {
  palette: {
    Z: '#5c6b4a', // bronze (verdigris)
    z: '#3f4a33',
    T: '#c9a227', // the famous shoe, rubbed gold
    G: '#adb5bd', // granite
    g: '#868e96',
    K: '#212529',
  },
  rows: [
    '......ZZZZ......',
    '.....ZZZZZZ.....',
    '.....ZzZZzZ.....',
    '.....ZZZZZZ.....',
    '......ZZZZ......',
    '....ZZZZZZZZ....',
    '...ZZZZZZZZZZ...',
    '...ZZZZZZZZZZ...',
    '...ZzZZZZZZzZ...',
    '...ZZZZZZZZZZ...',
    '....ZZZZZZZZZ...',
    '....zzZZZZZzz...',
    '....ZZ....ZZ....',
    '....ZZ....TT....',
    '..GGGGGGGGGGGG..',
    '.GGGGGGGGGGGGGG.',
    '.GgggggggggggggG',
    '.GgKKKKKKKKKKggG',
    '.GgKgggggggggggG',
    '.GggggggggggggG.',
    '.GGGGGGGGGGGGGG.',
    'GGGGGGGGGGGGGGGG',
    'gggggggggggggggg',
    'gggggggggggggggg',
  ],
}
