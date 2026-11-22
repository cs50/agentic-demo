/**
 * One Shiki highlighter for every visualization (and LiveSource), created on
 * first use. Light theme to match the deck; TypeScript, Python and SQL are the
 * languages the lecture's examples need.
 */
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

let promise: Promise<HighlighterCore> | null = null

export function getHighlighter(): Promise<HighlighterCore> {
  promise ??= createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs')],
    langs: [
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/python.mjs'),
      import('shiki/langs/sql.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  })
  return promise
}

export const SHIKI_THEME = 'github-light'
