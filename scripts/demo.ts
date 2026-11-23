/**
 * demo.ts — put the live demo files into a known state, from a terminal.
 *
 *   pnpm demo status           which state each live file is in
 *   pnpm demo reset            both files back to their start state (before the lecture)
 *   pnpm demo solve            both files to their working solution (the fallback)
 *   pnpm demo solve physics    only physics.ts
 *   pnpm demo solve level      only level.ts
 *
 * Copying a file over the live one is all it takes: the dev server sees the
 * write and the game, the code panel and the editor update without a reload.
 */

import { copyFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const FILES = ['level', 'physics'] as const
type Name = (typeof FILES)[number]

const live = (n: Name) => resolve(root, `demo/mario/${n}.ts`)
const start = (n: Name) => resolve(root, `demo/mario/start/${n}.ts`)
const solution = (n: Name) => resolve(root, `demo/mario/solutions/${n}.ts`)

function stateOf(n: Name): string {
  const text = readFileSync(live(n), 'utf8')
  if (text === readFileSync(start(n), 'utf8')) return 'start'
  if (text === readFileSync(solution(n), 'utf8')) return 'solution'
  return 'modified'
}

function pick(arg: string | undefined): Name[] {
  if (!arg) return [...FILES]
  if ((FILES as readonly string[]).includes(arg)) return [arg as Name]
  console.error(`unknown file "${arg}"; expected one of: ${FILES.join(', ')}`)
  process.exit(2)
}

const [command, which] = process.argv.slice(2)

switch (command) {
  case 'status':
    for (const n of FILES) console.log(`${n}.ts\t${stateOf(n)}`)
    break
  case 'reset':
    for (const n of pick(which)) {
      copyFileSync(start(n), live(n))
      console.log(`${n}.ts\t← start`)
    }
    break
  case 'solve':
    for (const n of pick(which)) {
      copyFileSync(solution(n), live(n))
      console.log(`${n}.ts\t← solution`)
    }
    break
  default:
    console.error('usage: pnpm demo <status | reset [level|physics] | solve [level|physics]>')
    process.exit(2)
}
