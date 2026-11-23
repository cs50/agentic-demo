/**
 * level.ts — THIS is the file the agent edits live.
 * CS50's classic mario.c in TypeScript: a loop inside a loop.
 * Each string is one row; each '#' a solid block on the ground.
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
