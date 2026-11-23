/**
 * tiles.ts — the campus tileset. Each tile is 16×16 pixels, drawn from a
 * pixel map like every sprite in this deck. The map (map.ts) is one character
 * per tile; this file says what each character looks like and whether the
 * duck can walk on it.
 */

import type { Sprite } from './sprites'

export const TILE = 16

const P: Record<string, string> = {
  // grass
  g: '#9ccc65',
  G: '#8bbf55',
  // path
  p: '#dfd9c8',
  q: '#cfc8b4',
  // brick (Harvard crimson tones)
  r: '#a51c30',
  R: '#8b1728',
  m: '#c9566a', // mortar highlight
  // concrete (Science Center)
  c: '#adb5bd',
  C: '#868e96',
  d: '#6c757d',
  // roof
  s: '#495057',
  S: '#343a40',
  // glass
  w: '#cfe8ff',
  W: '#9ec5f0',
  // wood / door
  D: '#6b4a2b',
  E: '#4a3219',
  // tree
  t: '#4f8f3a',
  T: '#3b6d2b',
  k: '#6b4a2b',
  // lamppost
  L: '#212529',
  l: '#ffe08a',
  // water
  b: '#56b4e9',
  B: '#3a8fc9',
  // white / text
  x: '#ffffff',
  K: '#212529',
}

function tile(rows: string[]): Sprite {
  return { rows, palette: P }
}

/** A flat 16×16 of one letter, with a few specks of another. */
function flat(base: string, speck: string, pattern: number[] = []): Sprite {
  const rows: string[] = []
  for (let r = 0; r < TILE; r++) {
    let row = ''
    for (let c = 0; c < TILE; c++) row += pattern.includes(r * TILE + c) ? speck : base
    rows.push(row)
  }
  return tile(rows)
}

const grass = flat('g', 'G', [19, 52, 77, 110, 133, 166, 199, 232])
const grassB = flat('g', 'G', [5, 40, 90, 125, 150, 185, 215, 250])
const path = flat('p', 'q', [33, 70, 120, 141, 190, 227])
const water = flat('b', 'B', [3, 20, 37, 70, 87, 104, 137, 154, 171, 204, 221, 238])

const brick = tile([
  'rrrrrrrmrrrrrrrm',
  'rrrrrrrmrrrrrrrm',
  'RRRRRRRRRRRRRRRR',
  'rrrmrrrrrrrmrrrr',
  'rrrmrrrrrrrmrrrr',
  'RRRRRRRRRRRRRRRR',
  'rrrrrrrmrrrrrrrm',
  'rrrrrrrmrrrrrrrm',
  'RRRRRRRRRRRRRRRR',
  'rrrmrrrrrrrmrrrr',
  'rrrmrrrrrrrmrrrr',
  'RRRRRRRRRRRRRRRR',
  'rrrrrrrmrrrrrrrm',
  'rrrrrrrmrrrrrrrm',
  'RRRRRRRRRRRRRRRR',
  'rrrmrrrrrrrmrrrr',
])

const brickWindow = tile([
  'rrrrrrrmrrrrrrrm',
  'rrrrrrrmrrrrrrrm',
  'RRRRRRRRRRRRRRRR',
  'rrrxxxxxxxxxxrrr',
  'rrrxwwwwWwwwxrrr',
  'RRRxwwwwWwwwxRRR',
  'rrrxwwwwWwwwxrrr',
  'rrrxWWWWWWWWxrrr',
  'RRRxwwwwWwwwxRRR',
  'rrrxwwwwWwwwxrrr',
  'rrrxwwwwWwwwxrrr',
  'RRRxxxxxxxxxxRRR',
  'rrrrrrrmrrrrrrrm',
  'rrrrrrrmrrrrrrrm',
  'RRRRRRRRRRRRRRRR',
  'rrrmrrrrrrrmrrrr',
])

const roof = tile([
  'SSSSSSSSSSSSSSSS',
  'ssssssssssssssss',
  'sSsSsSsSsSsSsSsS',
  'ssssssssssssssss',
  'SsSsSsSsSsSsSsSs',
  'ssssssssssssssss',
  'sSsSsSsSsSsSsSsS',
  'ssssssssssssssss',
  'SsSsSsSsSsSsSsSs',
  'ssssssssssssssss',
  'sSsSsSsSsSsSsSsS',
  'ssssssssssssssss',
  'SsSsSsSsSsSsSsSs',
  'ssssssssssssssss',
  'sSsSsSsSsSsSsSsS',
  'SSSSSSSSSSSSSSSS',
])

const concrete = tile([
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'cccccccccccccccc',
])

const concreteWindow = tile([
  'cccccccccccccccc',
  'cdddddddddddddcc',
  'cdwwwwwwwwwwwwdc',
  'cdwwwwwwwwwwwwdc',
  'cdwwwwWWWWwwwwdc',
  'cdwwwwwwwwwwwwdc',
  'cdddddddddddddcc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cdddddddddddddcc',
  'cdwwwwwwwwwwwwdc',
  'cdwwwwwwwwwwwwdc',
  'cdwwwwWWWWwwwwdc',
  'cdwwwwwwwwwwwwdc',
  'cdddddddddddddcc',
  'cccccccccccccccc',
])

/** The Gym sign over the Science Center door. */
const gymSign = tile([
  'cccccccccccccccc',
  'crrrrrrrrrrrrrrc',
  'crxxrrxxxrrxrxrc',
  'crxrrrxrxrrxxxrc',
  'crxxxrxxxrrxrxrc',
  'crxrxrrxrrrxrxrc',
  'crxxxrrxrrrxrxrc',
  'crrrrrrrrrrrrrrc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'cccccccccccccccc',
])

const doorWood = tile([
  'rrrrrrrmrrrrrrrm',
  'rrDDDDDDDDDDDDrr',
  'rrDEEEEEEEEEEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDlDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDEDDDDDDDDEDrr',
  'rrDDDDDDDDDDDDrr',
])

const doorGlass = tile([
  'cccccccccccccccc',
  'cdddddddddddddcc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwKwdwKwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdwwwwwwdwwwwwdc',
  'cdddddddddddddcc',
  'cccccccccccccccc',
])

const tree = tile([
  'gggggTTTTTTggggg',
  'gggTTTtttTTTTggg',
  'ggTTtttttttTTTgg',
  'gTTtttttttttTTTg',
  'gTttttttttttttTg',
  'TTttttTttttttTTT',
  'TtttttttttttttTT',
  'TtttttttTtttttTT',
  'gTtttttttttttTTg',
  'gTTttttttttttTTg',
  'ggTTTttttttTTTgg',
  'gggTTTTTTTTTTggg',
  'ggggggkkkkgggggg',
  'ggggggkkkkgggggg',
  'gggggGkkkkGggggg',
  'gggggggggggggggg',
])

const lamp = tile([
  'ggggggglggggggg',
  'ggggggllllggggg',
  'gggggglllllgggg',
  'ggggggllllggggg',
  'gggggggLLgggggg',
  'gggggggLLgggggg',
  'gggggggLLgggggg',
  'gggggggLLgggggg',
  'gggggggLLgggggg',
  'gggggggLLgggggg',
  'gggggggLLgggggg',
  'gggggggLLgggggg',
  'gggggggLLgggggg',
  'ggggggLLLLggggg',
  'gggggLLLLLLgggg',
  'gggggggggggggggg',
].map((r) => r.padEnd(16, 'g')))

const steps = tile([
  'pppppppppppppppp',
  'qqqqqqqqqqqqqqqq',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'qqqqqqqqqqqqqqqq',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'qqqqqqqqqqqqqqqq',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'qqqqqqqqqqqqqqqq',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'qqqqqqqqqqqqqqqq',
  'pppppppppppppppp',
  'pppppppppppppppp',
])

const column = tile([
  'pppppppppppppppp',
  'ppxxxxxxxxxxxxpp',
  'pppxxxxxxxxxxppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'ppppxxxxxxxxpppp',
  'pppxxxxxxxxxxppp',
  'ppxxxxxxxxxxxxpp',
  'pppppppppppppppp',
])

/** A pedestal footprint under the statue sprite. */
const plinth = tile([
  'pppppppppppppppp',
  'pppppppppppppppp',
  'ppCCCCCCCCCCCCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCccccccccccCpp',
  'ppCCCCCCCCCCCCpp',
  'pppppppppppppppp',
  'pppppppppppppppp',
])

export interface TileDef {
  sprite: Sprite
  solid: boolean
}

/** Map characters. Keep this in step with the legend comment in map.ts. */
export const TILES: Record<string, TileDef> = {
  '.': { sprite: grass, solid: false },
  ',': { sprite: grassB, solid: false },
  '=': { sprite: path, solid: false },
  '~': { sprite: water, solid: true },
  '#': { sprite: brick, solid: true },
  'o': { sprite: brickWindow, solid: true },
  '^': { sprite: roof, solid: true },
  'c': { sprite: concrete, solid: true },
  'w': { sprite: concreteWindow, solid: true },
  'Y': { sprite: gymSign, solid: true },
  'D': { sprite: doorWood, solid: true },
  'd': { sprite: doorGlass, solid: true }, // the Gym door: walking into it starts the battle
  'T': { sprite: tree, solid: true },
  'L': { sprite: lamp, solid: true },
  's': { sprite: steps, solid: false },
  'I': { sprite: column, solid: true },
  'J': { sprite: plinth, solid: true }, // John Harvard sits here; the statue sprite is drawn over it
}

export const GYM_DOOR = 'd'
export const STATUE_TILE = 'J'
