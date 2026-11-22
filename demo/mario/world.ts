/**
 * world.ts — turns ASCII rows (from level.ts) into a tile grid.
 *
 * Pure: it never imports level.ts, so the HMR boundary for live level
 * editing stays in liveLevel.ts. Every '#' becomes a solid TILE×TILE block.
 * Any other character is air.
 */

export const TILE = 32
export const COLS = 30 // 960px wide
export const ROWS = 17 // 544px tall
export const SOLID_CHAR = '#'

export interface World {
  cols: number
  rows: number
  /** Set of "col,row" keys that are solid. */
  solids: Set<string>
  /** Row index of the ground (the ground tiles themselves). */
  groundRow: number
  spawn: { x: number; y: number }
  /** Non-fatal problems with the level (too wide/tall), shown in the HUD. */
  warnings: string[]
}

export function key(col: number, row: number) {
  return `${col},${row}`
}

/**
 * Place `levelRows` bottom-aligned on the ground and centered horizontally.
 * `levelRows[0]` is the top row of the drawing, as in mario.c's output.
 */
export function buildWorld(levelRows: string[]): World {
  const solids = new Set<string>()
  const warnings: string[] = []
  const groundRow = ROWS - 1

  for (let c = 0; c < COLS; c++) solids.add(key(c, groundRow))

  // Drop empty leading/trailing rows so blank lines in the template don't shift the level.
  let rows = levelRows.map((r) => r.replace(/\s+$/, ''))
  while (rows.length && rows[0] === '') rows.shift()
  while (rows.length && rows[rows.length - 1] === '') rows.pop()

  const maxRows = ROWS - 2 // leave at least one row of headroom
  if (rows.length > maxRows) {
    warnings.push(`level is ${rows.length} rows tall; only the bottom ${maxRows} fit`)
    rows = rows.slice(rows.length - maxRows)
  }

  const width = rows.reduce((w, r) => Math.max(w, r.length), 0)
  if (width > COLS) warnings.push(`level is ${width} columns wide; the screen fits ${COLS}`)

  const offsetCol = Math.max(0, Math.floor((COLS - width) / 2))
  const bottomRow = groundRow - 1

  rows.forEach((text, i) => {
    const row = bottomRow - (rows.length - 1 - i)
    for (let j = 0; j < text.length; j++) {
      if (text[j] !== SOLID_CHAR) continue
      const col = offsetCol + j
      if (col >= 0 && col < COLS && row >= 0) solids.add(key(col, row))
    }
  })

  return {
    cols: COLS,
    rows: ROWS,
    solids,
    groundRow,
    spawn: { x: 2 * TILE, y: (groundRow - 2) * TILE },
    warnings,
  }
}

export function isSolid(world: World, col: number, row: number): boolean {
  if (col < 0 || col >= world.cols) return true // walls at the edges
  if (row >= world.rows) return true
  return world.solids.has(key(col, row))
}
