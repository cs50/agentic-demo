/**
 * tiles.ts — the campus tileset, Game Boy Color style. Each tile is 16×16
 * pixels drawn from a pixel map. Two tilesets: the Yard (outdoors) and the
 * Gym (indoors). An area (areas.ts) says which characters mean what.
 */

import { INK, type Sprite } from './sprites'

export const TILE = 16

/** The GBC-ish palette, shared by both tilesets. */
const P: Record<string, string> = {
  K: INK,
  // ground: pale with darker dots, as in Gold/Silver towns
  '.': '#e8ecd8',
  ':': '#c0c8b0',
  // grass
  g: '#98d070',
  G: '#70a850',
  // roof slats
  r: '#c89060',
  R: '#a87040',
  s: '#8898a8', // slate roof (Science Center)
  S: '#607080',
  // walls
  b: '#b05858', // brick
  B: '#884040',
  m: '#d8a898', // mortar
  c: '#c8c8c0', // concrete
  C: '#a0a098',
  w: '#f8f0d0', // lit window
  W: '#e0c870',
  // doors
  d: '#806048',
  D: '#604830',
  // trees
  t: '#78b860',
  T: '#48884a',
  k: '#6a4a30',
  // signpost
  p: '#c8c8c0',
  // lamppost
  l: '#f8e8a0',
  // interior
  f: '#e0d8c8', // floor
  F: '#c8c0b0',
  x: '#5868a0', // gym mat
  X: '#405080',
  v: '#a89888', // wall (indoor)
  V: '#786858',
  y: '#f0f0f0', // chalk white
}

function tile(rows: string[]): Sprite {
  return { rows, palette: P }
}

/** A 16×16 of one letter with dots of another at the given cells. */
function dotted(base: string, dot: string, cells: number[]): Sprite {
  const rows: string[] = []
  for (let r = 0; r < TILE; r++) {
    let row = ''
    for (let c = 0; c < TILE; c++) row += cells.includes(r * TILE + c) ? dot : base
    rows.push(row)
  }
  return tile(rows)
}

const ground = dotted('.', ':', [18, 21, 59, 72, 109, 134, 157, 194, 203, 230])
const groundB = dotted('.', ':', [6, 45, 82, 97, 139, 160, 183, 222, 241, 252])
/** Paths: the same pale ground, undotted, so routes read at a glance. */
const path = dotted('.', ':', [])
const grass = tile([
  'gggggggggggggggg',
  'ggGgggggggggGggg',
  'gGGGgggggggGGGgg',
  'ggGgggggggggGggg',
  'gggggggggggggggg',
  'gggggGggggggggGg',
  'ggggGGGgggggGGGg',
  'gggggGggggggggGg',
  'gggggggggggggggg',
  'gGgggggggggGgggg',
  'GGGggggggggGGGgg',
  'gGgggggggggGgggg',
  'gggggggggggggggg',
  'gggggggGgggggggg',
  'ggggggGGGggggggg',
  'gggggggGgggggggg',
])

const roofSlats = tile([
  'KKKKKKKKKKKKKKKK',
  'rrrrrrrrrrrrrrrr',
  'rKrrrKrrrKrrrKrr',
  'rKrrrKrrrKrrrKrr',
  'rKrrrKrrrKrrrKrr',
  'rKrrrKrrrKrrrKrr',
  'rKrrrKrrrKrrrKrr',
  'rKrrrKrrrKrrrKrr',
  'RRRRRRRRRRRRRRRR',
  'rrrrrrrrrrrrrrrr',
  'rKrrrKrrrKrrrKrr',
  'rKrrrKrrrKrrrKrr',
  'rKrrrKrrrKrrrKrr',
  'rKrrrKrrrKrrrKrr',
  'RRRRRRRRRRRRRRRR',
  'KKKKKKKKKKKKKKKK',
])

const roofSlate = tile([
  'KKKKKKKKKKKKKKKK',
  'ssssssssssssssss',
  'sKsssKsssKsssKss',
  'sKsssKsssKsssKss',
  'sKsssKsssKsssKss',
  'sKsssKsssKsssKss',
  'sKsssKsssKsssKss',
  'sKsssKsssKsssKss',
  'SSSSSSSSSSSSSSSS',
  'ssssssssssssssss',
  'sKsssKsssKsssKss',
  'sKsssKsssKsssKss',
  'sKsssKsssKsssKss',
  'sKsssKsssKsssKss',
  'SSSSSSSSSSSSSSSS',
  'KKKKKKKKKKKKKKKK',
])

const brick = tile([
  'bbbbbbbmbbbbbbbm',
  'bbbbbbbmbbbbbbbm',
  'mmmmmmmmmmmmmmmm',
  'bbbmbbbbbbbmbbbb',
  'bbbmbbbbbbbmbbbb',
  'mmmmmmmmmmmmmmmm',
  'bbbbbbbmbbbbbbbm',
  'bbbbbbbmbbbbbbbm',
  'mmmmmmmmmmmmmmmm',
  'bbbmbbbbbbbmbbbb',
  'bbbmbbbbbbbmbbbb',
  'mmmmmmmmmmmmmmmm',
  'bbbbbbbmbbbbbbbm',
  'bbbbbbbmbbbbbbbm',
  'BBBBBBBBBBBBBBBB',
  'KKKKKKKKKKKKKKKK',
])

const brickWindow = tile([
  'bbbbbbbmbbbbbbbm',
  'bbbKKKKKKKKKKbbm',
  'mmmKwwwwKwwwKmmm',
  'bbbKwwwwKwwwKbbb',
  'bbbKwwwwKwwwKbbb',
  'mmmKKKKKKKKKKmmm',
  'bbbKwwwwKwwwKbbm',
  'bbbKwwwwKwwwKbbm',
  'mmmKwwwwKwwwKmmm',
  'bbbKKKKKKKKKKbbb',
  'bbbmbbbbbbbmbbbb',
  'mmmmmmmmmmmmmmmm',
  'bbbbbbbmbbbbbbbm',
  'bbbbbbbmbbbbbbbm',
  'BBBBBBBBBBBBBBBB',
  'KKKKKKKKKKKKKKKK',
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
  'KKKKKKKKKKKKKKKK',
])

const concreteWindow = tile([
  'cccccccccccccccc',
  'cKKKKKKKKKKKKKKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKKKKKKKKKKKKKKc',
  'CCCCCCCCCCCCCCCC',
  'cccccccccccccccc',
  'cKKKKKKKKKKKKKKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKKKKKKKKKKKKKKc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'KKKKKKKKKKKKKKKK',
])

/** "GYM" lettering over the door, as in the reference. */
const gymSign = tile([
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cKKKcKcKcKKKcccc',
  'cKcccKcKcKcKcccc',
  'cKcKcKcKcKcKcccc',
  'cKcKccKccKcKcccc',
  'cKKKccKccKcKcccc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'CCCCCCCCCCCCCCCC',
  'KKKKKKKKKKKKKKKK',
])

const doorWood = tile([
  'bbbbbbbmbbbbbbbm',
  'bbKKKKKKKKKKKKbb',
  'bbKddddddddddKbb',
  'bbKdDDDDDDDDdKbb',
  'bbKdDwwwwwwDdKbb',
  'bbKdDwwwwwwDdKbb',
  'bbKdDDDDDDDDdKbb',
  'bbKddddddddddKbb',
  'bbKddddlddddddKb',
  'bbKddddddddddKbb',
  'bbKddddddddddKbb',
  'bbKddddddddddKbb',
  'bbKddddddddddKbb',
  'bbKddddddddddKbb',
  'BBKddddddddddKBB',
  'KKKKKKKKKKKKKKKK',
])

const doorGlass = tile([
  'cccccccccccccccc',
  'cKKKKKKKKKKKKKKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwKwKwKwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKwwwwwwKwwwwwKc',
  'cKKKKKKKKKKKKKKc',
  'KKKKKKKKKKKKKKKK',
])

const tree = tile([
  '.....KKKKKK.....',
  '...KKtttttTKK...',
  '..KttttttttttK..',
  '.KtttTtttttttTK.',
  '.KttttttttTtttK.',
  'KttTtttttttttttK',
  'KtttttttTttttttK',
  'KttttttttttttttK',
  'KTttttTtttttTttK',
  '.KtttttttTttttK.',
  '.KTTttttttttTTK.',
  '..KKTTTTTTTTKK..',
  '....KKkkkkKK....',
  '.....KkkkkK.....',
  '.....KkkkkK.....',
  '....KKKKKKKK....',
])

const signpost = tile([
  '................',
  '..KKKKKKKKKKKK..',
  '.KppppppppppppK.',
  '.KpKKKKKKKKKKpK.',
  '.KppppppppppppK.',
  '.KpKKKKKKKKKKpK.',
  '.KppppppppppppK.',
  '.KpKKKKKKKKKKpK.',
  '.KppppppppppppK.',
  '..KKKKKKKKKKKK..',
  '......KKKK......',
  '......KppK......',
  '......KppK......',
  '......KppK......',
  '.....KKKKKK.....',
  '................',
])

const lamppost = tile([
  '.......KK.......',
  '......KllK......',
  '.....KllllK.....',
  '......KllK......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '......KKKK......',
  '.....KKKKKK.....',
  '................',
])

const steps = tile([
  '::::::::::::::::',
  '................',
  '................',
  '::::::::::::::::',
  '................',
  '................',
  '::::::::::::::::',
  '................',
  '................',
  '::::::::::::::::',
  '................',
  '................',
  '::::::::::::::::',
  '................',
  '................',
  '::::::::::::::::',
])

const column = tile([
  'cccccccccccccccc',
  'cKKKKKKKKKKKKKKc',
  'ccKwwwwwwwwwwKcc',
  'cccKwwwwwwwwKccc',
  'cccKwwwwwwwwKccc',
  'cccKwwwwwwwwKccc',
  'cccKwwwwwwwwKccc',
  'cccKwwwwwwwwKccc',
  'cccKwwwwwwwwKccc',
  'cccKwwwwwwwwKccc',
  'cccKwwwwwwwwKccc',
  'cccKwwwwwwwwKccc',
  'ccKwwwwwwwwwwKcc',
  'cKKKKKKKKKKKKKKc',
  'CCCCCCCCCCCCCCCC',
  'KKKKKKKKKKKKKKKK',
])

/** Where the statue stands (the sprite is drawn over it). Pale stone footprint. */
const plinth = tile([
  '................',
  '................',
  '..KKKKKKKKKKKK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KccccccccccK..',
  '..KKKKKKKKKKKK..',
  '................',
  '................',
])

// -------------------------------------------------------------- the Gym

const floor = tile([
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'FFFFFFFFFFFFFFFF',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'ffffffffffffffff',
  'FFFFFFFFFFFFFFFF',
])

const wall = tile([
  'vvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvv',
  'VVVVVVVVVVVVVVVV',
  'vvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvv',
  'VVVVVVVVVVVVVVVV',
  'vvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvv',
  'VVVVVVVVVVVVVVVV',
  'vvvvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvvvv',
  'VVVVVVVVVVVVVVVV',
  'KKKKKKKKKKKKKKKK',
  'ffffffffffffffff',
])

const wallPlain = tile(Array(16).fill('vvvvvvvvvvvvvvvv').map((r, i) => (i % 4 === 2 ? 'VVVVVVVVVVVVVVVV' : r)))

/** A blackboard with chalk on it: the Gym's wall decoration. */
const blackboard = tile([
  'vvvvvvvvvvvvvvvv',
  'vKKKKKKKKKKKKKKv',
  'vKrrrrrrrrrrrrKv',
  'vKrKKKKKKKKKKrKv',
  'vKrKyyKyyyKKKrKv',
  'vKrKKKKKKKKKKrKv',
  'vKrKyKyyKyyyKrKv',
  'vKrKKKKKKKKKKrKv',
  'vKrKyyyKyKKKKrKv',
  'vKrKKKKKKKKKKrKv',
  'vKrrrrrrrrrrrrKv',
  'vKKKKKKKKKKKKKKv',
  'vvvvvvvvvvvvvvvv',
  'VVVVVVVVVVVVVVVV',
  'KKKKKKKKKKKKKKKK',
  'ffffffffffffffff',
])

const mat = tile([
  'ffffffffffffffff',
  'fKKKKKKKKKKKKKKf',
  'fKxxxxxxxxxxxxKf',
  'fKxXXXXXXXXXXxKf',
  'fKxXxxxxxxxxXxKf',
  'fKxXxxxxxxxxXxKf',
  'fKxXxxxxxxxxXxKf',
  'fKxXxxxxxxxxXxKf',
  'fKxXxxxxxxxxXxKf',
  'fKxXxxxxxxxxXxKf',
  'fKxXxxxxxxxxXxKf',
  'fKxXXXXXXXXXXxKf',
  'fKxxxxxxxxxxxxKf',
  'fKKKKKKKKKKKKKKf',
  'ffffffffffffffff',
  'FFFFFFFFFFFFFFFF',
])

/** The leader's dais: a raised strip of darker floor with a lip. */
const dais = tile([
  'KKKKKKKKKKKKKKKK',
  'xxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'XXXXXXXXXXXXXXXX',
  'xxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'XXXXXXXXXXXXXXXX',
  'KKKKKKKKKKKKKKKK',
  'ffffffffffffffff',
  'FFFFFFFFFFFFFFFF',
])

const pillar = tile([
  'ffffffffffffffff',
  'ffffKKKKKKKKffff',
  'fffKccccccccKfff',
  'fffKcCccccCcKfff',
  'ffffKccccccKffff',
  'ffffKccccccKffff',
  'ffffKccccccKffff',
  'ffffKccccccKffff',
  'ffffKccccccKffff',
  'ffffKccccccKffff',
  'ffffKccccccKffff',
  'ffffKccccccKffff',
  'fffKccccccccKfff',
  'ffKKKKKKKKKKKKff',
  'ffffffffffffffff',
  'FFFFFFFFFFFFFFFF',
])

export interface TileDef {
  sprite: Sprite
  solid: boolean
}

export const YARD_TILES: Record<string, TileDef> = {
  '.': { sprite: ground, solid: false },
  ',': { sprite: groundB, solid: false },
  '=': { sprite: path, solid: false },
  'g': { sprite: grass, solid: false },
  '#': { sprite: brick, solid: true },
  'o': { sprite: brickWindow, solid: true },
  '^': { sprite: roofSlats, solid: true },
  'c': { sprite: concrete, solid: true },
  'w': { sprite: concreteWindow, solid: true },
  '/': { sprite: roofSlate, solid: true },
  'Y': { sprite: gymSign, solid: true },
  'D': { sprite: doorWood, solid: true },
  'd': { sprite: doorGlass, solid: true }, // the Gym door: walking into it goes inside
  'T': { sprite: tree, solid: true },
  'L': { sprite: lamppost, solid: true },
  'P': { sprite: signpost, solid: true },
  's': { sprite: steps, solid: false },
  'I': { sprite: column, solid: true },
  'J': { sprite: plinth, solid: true }, // John Harvard sits here
}

export const GYM_TILES: Record<string, TileDef> = {
  ' ': { sprite: floor, solid: false },
  'W': { sprite: wall, solid: true },
  'V': { sprite: wallPlain, solid: true },
  'B': { sprite: blackboard, solid: true },
  'M': { sprite: mat, solid: false }, // the exit: stepping on it leaves
  'A': { sprite: dais, solid: true },
  'I': { sprite: pillar, solid: true },
}

export const GYM_DOOR = 'd'
export const STATUE_TILE = 'J'
export const EXIT_MAT = 'M'
