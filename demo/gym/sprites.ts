/**
 * sprites.ts — pixel-map sprites for the campus game, Game Boy Color style:
 * 16×16, a dark outline around everything, big heads, two walking frames.
 *
 * A sprite is rows of palette letters, as in demo/mario/duck.ts: '.' is
 * transparent, any other character looks up a colour. One drawing routine
 * renders any of them to a canvas at an integer scale, optionally mirrored,
 * optionally with per-letter colour overrides (that is how one person
 * template becomes many people).
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
      if (!fill || fill === 'none') continue
      const cc = flipX ? w - 1 - c : c
      ctx.fillStyle = fill
      ctx.fillRect(x + cc * scale, y + r * scale, scale, scale)
    }
  }
}

/** The outline colour every sprite shares (GBC's near-black). */
export const INK = '#182028'

/**
 * Add a one-pixel outline around a sprite's opaque pixels, growing the canvas
 * by one on each side. This is how the Mario duck becomes a GBC overworld duck.
 */
export function outlined(s: Sprite, ink = INK): Sprite {
  const { w, h } = spriteSize(s)
  const grid: string[][] = Array.from({ length: h + 2 }, () => Array(w + 2).fill('.'))
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (s.rows[r][c] !== '.') grid[r + 1][c + 1] = s.rows[r][c]
  const out = grid.map((row) => [...row])
  for (let r = 0; r < h + 2; r++) {
    for (let c = 0; c < w + 2; c++) {
      if (grid[r][c] !== '.') continue
      const near = [grid[r - 1]?.[c], grid[r + 1]?.[c], grid[r][c - 1], grid[r][c + 1]].some((x) => x && x !== '.')
      if (near) out[r][c] = '§'
    }
  }
  return { rows: out.map((row) => row.join('')), palette: { ...s.palette, '§': ink } }
}

// ------------------------------------------------------------------ the duck

import { DUCK_PALETTE, DUCK_ROWS } from '../mario/duck'

const DUCK_BASE: Sprite = { rows: DUCK_ROWS, palette: DUCK_PALETTE }

/** Side view, facing right, outlined: 16×16. */
export const DUCK_SIDE: Sprite = outlined(DUCK_BASE)

/** From behind (battle screen, and walking up). */
export const DUCK_BACK: Sprite = outlined({
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
})

const DUCK_DOWN: Sprite = outlined({
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
})

export type Facing = 'up' | 'down' | 'left' | 'right'

/** Frame for a walking duck: it bobs a pixel on the odd frame. */
export function duckWalk(facing: Facing): { sprite: Sprite; flipX: boolean } {
  switch (facing) {
    case 'down':
      return { sprite: DUCK_DOWN, flipX: false }
    case 'up':
      return { sprite: DUCK_BACK, flipX: false }
    case 'right':
      return { sprite: DUCK_SIDE, flipX: false }
    case 'left':
      return { sprite: DUCK_SIDE, flipX: true }
  }
}

// ------------------------------------------------------------------- people

/**
 * One 16×16 person, GBC proportions: a big head, a short body. Letters:
 *   K outline/shoes   H hair   F skin   E eye   S shirt   P trousers
 *   G glasses         T tie    (G and T are transparent unless a Look sets them)
 * Six frames: facing down/up/side, standing (A) and stepping (B). Side faces right.
 */
const PEOPLE_PALETTE: Record<string, string> = {
  K: INK,
  H: '#3a2a1a',
  F: '#f0c8a0',
  E: INK,
  S: '#a51c30',
  P: '#405068',
  G: 'none',
  T: 'none',
  W: '#f8f8f8',
}

const DOWN_A = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHFFFFFFHK...',
  '...KFGEFFEGFK...',
  '...KFFFFFFFFK...',
  '....KFFFFFFK....',
  '....KKSTTSKK....',
  '...KSSSTTSSSK...',
  '..KFKSSTTSSKFK..',
  '..KFKSSSSSSKFK..',
  '...K.KPPPPK.K...',
  '.....KPPPPK.....',
  '.....KPKKPK.....',
  '.....KK..KK.....',
]
const DOWN_B = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHFFFFFFHK...',
  '...KFGEFFEGFK...',
  '...KFFFFFFFFK...',
  '....KFFFFFFK....',
  '....KKSTTSKK....',
  '...KSSSTTSSSK...',
  '..KFKSSTTSSKFK..',
  '..KFKSSSSSSKFK..',
  '...K.KPPPPK.K...',
  '....KPPKKPPK....',
  '....KPK..KPK....',
  '....KK....KK....',
]
const UP_A = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KFHHHHHHFK...',
  '....KFFFFFFK....',
  '....KKSSSSKK....',
  '...KSSSSSSSSK...',
  '..KFKSSSSSSKFK..',
  '..KFKSSSSSSKFK..',
  '...K.KPPPPK.K...',
  '.....KPPPPK.....',
  '.....KPKKPK.....',
  '.....KK..KK.....',
]
const UP_B = [...UP_A.slice(0, 12), '...K.KPPPPK.K...', '....KPPKKPPK....', '....KPK..KPK....', '....KK....KK....']
const SIDE_A = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHHFFFFFFK...',
  '...KHFFFGEFFK...',
  '...KHFFFFFFFK...',
  '....KFFFFFFK....',
  '.....KSSSSKK....',
  '....KSSSSSSSK...',
  '....KSSSSSKFK...',
  '....KSSSSSKFK...',
  '.....KPPPPK.K...',
  '.....KPPPPK.....',
  '.....KPKKPK.....',
  '.....KK..KK.....',
]
const SIDE_B = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHHFFFFFFK...',
  '...KHFFFGEFFK...',
  '...KHFFFFFFFK...',
  '....KFFFFFFK....',
  '.....KSSSSKK....',
  '....KSSSSSSSK...',
  '....KSSSSSKFK...',
  '....KSSSSSKFK...',
  '.....KPPPPK.K...',
  '....KPPKPPK.....',
  '...KPPK.KPK.....',
  '...KKK..KKK.....',
]

const PERSON_FRAMES: Record<Facing, [string[], string[]]> = {
  down: [DOWN_A, DOWN_B],
  up: [UP_A, UP_B],
  right: [SIDE_A, SIDE_B],
  left: [SIDE_A, SIDE_B],
}

/** How a particular person looks: colours for the template, and optional features. */
export interface Look {
  hair: string
  skin?: string
  shirt: string
  trousers?: string
  /** Draw spectacles over the eyes. */
  glasses?: boolean
  /** Draw a tie down the shirt. */
  tie?: string
  /** Hair only at the sides and back; skin shows on top. */
  receding?: boolean
  /** Hair falls past the shoulders. */
  longHair?: boolean
}

export function personSprite(look: Look, facing: Facing, frame: 0 | 1): { sprite: Sprite; flipX: boolean } {
  let rows = PERSON_FRAMES[facing][frame]
  if (look.receding) {
    // Open the top of the head: hair stays as a fringe at the outline.
    rows = rows.map((row, r) => (r >= 1 && r <= 3 && facing !== 'up' ? row.replace(/KH(H+)HK/, (m, mid) => `KH${'F'.repeat(mid.length)}HK`) : row))
    if (facing === 'up') rows = rows.map((row, r) => (r >= 1 && r <= 4 ? row.replace(/KH(H+)HK/, (m, mid) => `KH${'F'.repeat(mid.length)}HK`) : row))
  }
  if (look.longHair) rows = rows.map((row, r) => longHairRow(row, r))
  const palette: Record<string, string> = {
    ...PEOPLE_PALETTE,
    H: look.hair,
    F: look.skin ?? PEOPLE_PALETTE.F,
    S: look.shirt,
    P: look.trousers ?? PEOPLE_PALETTE.P,
    G: look.glasses ? '#405068' : look.skin ?? PEOPLE_PALETTE.F,
    T: look.tie ?? look.shirt,
  }
  return { sprite: { rows, palette }, flipX: facing === 'left' }
}

/**
 * Long hair: on the face rows the outermost face pixels become hair; on the
 * shoulder rows the hair hangs one pixel outside the body outline. Rows stay
 * 16 wide: characters are swapped, never added.
 */
function longHairRow(row: string, r: number): string {
  const cells = row.split('')
  const first = cells.indexOf('K')
  const last = cells.lastIndexOf('K')
  if (first < 0 || last <= first) return row
  if (r >= 4 && r <= 7) {
    if ('FG'.includes(cells[first + 1])) cells[first + 1] = 'H'
    if ('FG'.includes(cells[last - 1])) cells[last - 1] = 'H'
  } else if (r === 8 || r === 9) {
    if (first > 0) {
      cells[first] = 'H'
      cells[first - 1] = 'K'
    }
    if (last < cells.length - 1) {
      cells[last] = 'H'
      cells[last + 1] = 'K'
    }
  }
  return cells.join('')
}

// ------------------------------------------------------------ John Harvard

/** The statue: a seated bronze figure on a granite plinth, 16×24, drawn over two tiles. */
export const STATUE: Sprite = {
  palette: {
    K: INK,
    Z: '#6a8060', // verdigris bronze
    z: '#48604a',
    T: '#e0b040', // the shoe, rubbed gold
    G: '#b8b8b0', // granite
    g: '#888880',
  },
  rows: [
    '......KKKK......',
    '.....KZZZZK.....',
    '.....KZzZzK.....',
    '.....KZZZZK.....',
    '......KZZK......',
    '....KKZZZZKK....',
    '...KZZZZZZZZK...',
    '...KZzZZZZzZK...',
    '...KZZZZZZZZK...',
    '...KZZZZZZZZK...',
    '....KZZZZZZZK...',
    '....KzzZZZzzK...',
    '....KZK..KZK....',
    '....KZK..KTK....',
    '..KKKKKKKKKKKK..',
    '.KGGGGGGGGGGGGK.',
    '.KGggggggggggGK.',
    '.KGgKKKKKKKKgGK.',
    '.KGggggggggggGK.',
    '.KGGGGGGGGGGGGK.',
    'KGGGGGGGGGGGGGGK',
    'KggggggggggggggK',
    'KggggggggggggggK',
    'KKKKKKKKKKKKKKKK',
  ],
}
