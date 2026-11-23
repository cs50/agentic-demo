import { describe, expect, it } from 'vitest'
import { describeTransformError } from '../demo/mario/transformError'

describe('describeTransformError', () => {
  it('extracts esbuild reason with line and column', () => {
    const err = {
      message:
        'Transform failed with 1 error:\n/repo/demo/mario/level.ts:9:28: ERROR: Expected ")" but found "{"',
      loc: { file: '/repo/demo/mario/level.ts', line: 9, column: 28 },
    }
    expect(describeTransformError(err)).toBe(
      'SyntaxError (line 9, column 28): Expected ")" but found "{"',
    )
  })

  it('reads the oxc (Vite 8) box header for the location and drops the error code', () => {
    const err = {
      message:
        'Transform failed with 1 error:\n\n[PARSE_ERROR] Unexpected token\n   ╭─[ demo/mario/physics.ts:3:15 ]\n   │\n 3 │   return vy + )\n   │               ┬  \n   │               ╰── \n───╯\n',
    }
    expect(describeTransformError(err)).toBe('SyntaxError (line 3, column 15): Unexpected token')
  })

  it('omits the location when loc is missing', () => {
    const err = { message: 'Transform failed with 1 error:\nlevel.ts:2:3: ERROR: Unexpected "}"' }
    expect(describeTransformError(err)).toBe('SyntaxError: Unexpected "}"')
  })

  it('falls back to the first line when there is no ERROR: prefix', () => {
    expect(describeTransformError({ message: 'Something odd\nsecond line' })).toBe(
      'SyntaxError: Something odd',
    )
  })

  it('tolerates a missing message or error object', () => {
    expect(describeTransformError({})).toBe('SyntaxError: syntax error')
    expect(describeTransformError(null)).toBe('SyntaxError: syntax error')
    expect(describeTransformError(undefined)).toBe('SyntaxError: syntax error')
  })
})
