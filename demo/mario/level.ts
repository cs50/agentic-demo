/**
 * level.ts — THIS is the file the agent edits live.
 * CS50's classic mario.c in TypeScript: each string is one
 * row, each '#' a solid block, sitting on the ground.
 */

export const HEIGHT = 8

export function buildLevel(): string[] {
  const rows: string[] = []

  // for each row i: (HEIGHT - i) spaces, then i hashes
  for (let i = 1; i <= HEIGHT; i++) {
    const spaces = ' '.repeat(HEIGHT - i)
    const hashes = '#'.repeat(i)
    rows.push(spaces + hashes)
  }

  return rows
}
