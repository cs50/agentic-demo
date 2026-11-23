/**
 * transformError.ts — turns the error Vite reports for a live file that does
 * not compile into one line for the game's error strip.
 *
 * Two shapes arrive, depending on Vite's transformer:
 *   esbuild (Vite ≤ 7)  message "Transform failed with 1 error:\n<file>:<line>:<col>: ERROR: <reason>"
 *                       plus `loc: { line, column }`
 *   oxc (Vite 8)        message "Transform failed with 1 error:\n\n[PARSE_ERROR] <reason>\n   ╭─[ <file>:<line>:<col> ]\n…"
 *                       and no `loc`
 *
 * Kept free of imports so it can be unit-tested without loading the level.
 */

export interface TransformErrorLike {
  message?: string
  loc?: { line?: number; column?: number; file?: string }
}

/** Turn a multi-line transform error into one readable line. */
export function describeTransformError(err: TransformErrorLike | null | undefined): string {
  const raw: string = err?.message ?? 'syntax error'
  const lines = raw.split('\n')

  let line = err?.loc?.line
  let column = err?.loc?.column
  if (line === undefined) {
    // oxc draws the location in a box header: "╭─[ demo/mario/physics.ts:3:15 ]"
    const m = raw.match(/╭─\[\s*\S+?:(\d+):(\d+)\s*\]/)
    if (m) {
      line = Number(m[1])
      column = Number(m[2])
    }
  }
  const where = line !== undefined ? ` (line ${line}, column ${column})` : ''

  const reason =
    lines
      .map((l) => l.replace(/^.*?ERROR:\s*/, '').replace(/^\[[A-Z_]+\]\s*/, '').trim())
      .find((l) => l && !/^Transform failed/.test(l) && !/^[╭│─╯\s]/.test(l) && !/^\d+\s*│/.test(l)) ??
    lines[0]
  return `SyntaxError${where}: ${reason}`
}
