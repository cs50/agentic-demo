/**
 * duck.ts — the CS50 duck as a 14×14 pixel sprite.
 *
 * One source of truth for the character: the game draws it on its canvas
 * (drawDuck) and slides draw it as SVG (components/viz/DuckSprite.vue).
 * Colours follow the CS50 rubber duck: warm yellow body, orange beak, dark
 * outline, blue eye with a white highlight.
 *
 * Legend:  . transparent   Y yellow   D outline   O beak   B eye   W highlight
 */

export const DUCK_PALETTE: Record<string, string> = {
  Y: '#FCCE69',
  D: '#4A3F1D',
  O: '#FC8A4A',
  B: '#2A6F8F',
  W: '#FFFFFF',
}

/** Facing right. Rows top to bottom. */
export const DUCK_ROWS: string[] = [
  '....DDDD......',
  '...DYYYYD.....',
  '..DYYYYYYD....',
  '..DYYYBWYD....',
  '..DYYYBBYDOO..',
  '..DYYYYYYDOOO.',
  '...DYYYYYYDO..',
  '.DD.DYYYYYD...',
  'DYYDYYYYYYYD..',
  'DYYYYYYYYYYYD.',
  '.DYYYYYYYYYYD.',
  '..DYYYYYYYYYD.',
  '...DDYYYYYDD..',
  '.....DDDDD....',
]

export const DUCK_COLS = DUCK_ROWS[0].length
export const DUCK_ROWS_N = DUCK_ROWS.length

/** Pixel at (col,row) for a given facing, or null if transparent. */
export function duckPixel(col: number, row: number, facing: 1 | -1): string | null {
  const c = facing === 1 ? col : DUCK_COLS - 1 - col
  const ch = DUCK_ROWS[row]?.[c] ?? '.'
  return ch === '.' ? null : DUCK_PALETTE[ch] ?? null
}

/**
 * Draw the duck on a canvas with its top-left corner at (x, y), each sprite
 * pixel `scale` device pixels wide.
 */
export function drawDuck(ctx: CanvasRenderingContext2D, x: number, y: number, facing: 1 | -1, scale: number) {
  for (let r = 0; r < DUCK_ROWS_N; r++) {
    for (let c = 0; c < DUCK_COLS; c++) {
      const color = duckPixel(c, r, facing)
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(Math.round(x + c * scale), Math.round(y + r * scale), scale, scale)
    }
  }
}
