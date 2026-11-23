/**
 * level.ts — the level, as rows of text. THIS file is edited live.
 *
 * Each string is one row and each '#' is a solid block. The rows are drawn
 * bottom-aligned on the ground and centred, exactly as mario.c prints them.
 *
 * CS50's classic mario.c in TypeScript: a loop inside a loop.
 */

export const HEIGHT = 8

export function buildLevel(): string[] {
  const rows: string[] = []

  for (let i = 1; i <= HEIGHT; i++) {
    let row = ''
    for (let j = 0; j < HEIGHT - i; j++) row += ' '
    for (let k = 0; k < i; k++) row += '#'
    rows.push(row)
  }

  return rows
}
