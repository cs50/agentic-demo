/**
 * level.ts — the level, as rows of text. THIS file is edited live.
 *
 * Each string is one row and each '#' is a solid block. The rows are drawn
 * bottom-aligned on the ground and centred, exactly as mario.c prints them.
 *
 * The room chose: towers. Four columns of different heights with a one-block
 * gap between them, so every jump has to be judged.
 */

export const HEIGHTS = [3, 6, 2, 5]

export function buildLevel(): string[] {
  const tallest = Math.max(...HEIGHTS)
  const rows: string[] = []

  for (let y = tallest; y >= 1; y--) {
    let row = ''
    for (const h of HEIGHTS) row += (h >= y ? '##' : '  ') + ' '
    rows.push(row.trimEnd())
  }

  return rows
}
