/**
 * level.ts — the level, as rows of text. THIS file is edited live.
 *
 * Each string is one row and each '#' is a solid block. The rows are drawn
 * bottom-aligned on the ground and centred, exactly as mario.c prints them.
 *
 * The room chose: the "more comfortable" Mario, two half-pyramids facing each
 * other across a gap two blocks wide. Can the duck clear the gap?
 */

export const HEIGHT = 8
export const GAP = 2

export function buildLevel(): string[] {
  const rows: string[] = []

  for (let i = 1; i <= HEIGHT; i++) {
    const blocks = '#'.repeat(i)
    rows.push(' '.repeat(HEIGHT - i) + blocks + ' '.repeat(GAP) + blocks)
  }

  return rows
}
