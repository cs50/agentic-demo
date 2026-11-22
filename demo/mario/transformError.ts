/**
 * transformError.ts — turns the error Vite reports for a level.ts that does
 * not compile into one line for the game's error strip.
 *
 * Kept free of imports so it can be unit-tested without loading the level.
 */

export interface TransformErrorLike {
  message?: string
  loc?: { line?: number; column?: number; file?: string }
}

/** Turn esbuild's multi-line transform error into one readable line. */
export function describeTransformError(err: TransformErrorLike | null | undefined): string {
  const where = err?.loc ? ` (line ${err.loc.line}, column ${err.loc.column})` : ''
  // esbuild's message is "Transform failed with 1 error:\n<file>:<line>:<col>: ERROR: <reason>".
  const raw: string = err?.message ?? 'syntax error'
  const reason = raw.split('\n').map((l: string) => l.replace(/^.*?ERROR:\s*/, '').trim())
    .find((l: string) => l && !/^Transform failed/.test(l)) ?? raw.split('\n')[0]
  return `SyntaxError${where}: ${reason}`
}
