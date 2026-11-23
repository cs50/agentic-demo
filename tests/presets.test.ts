/**
 * Every preset the room can vote for must be a working live file: the engine
 * will load the winner the moment the vote closes, mid-lecture, with no one
 * reading it first.
 */
import { describe, expect, it } from 'vitest'
import { adaptPhysics } from '../demo/mario/livePhysics'
import { PRESETS, presetNames, targetOf } from '../demo/mario/presets'
import { COLS, ROWS, buildWorld } from '../demo/mario/world'

const modules = import.meta.glob('../demo/mario/presets/*.ts', { eager: true }) as Record<string, Record<string, unknown>>
const moduleFor = (name: string) => modules[`../demo/mario/presets/${name}.ts`]

describe('presets', () => {
  it('exist, and each names the live file it replaces', () => {
    const names = presetNames()
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) {
      expect(targetOf(name), name).not.toBeNull()
      expect(PRESETS[name]).toContain('export')
      expect(moduleFor(name), `${name} should be importable`).toBeDefined()
    }
  })

  it('level presets build a world that fits the screen, with no warnings', () => {
    for (const name of presetNames().filter((n) => n.startsWith('level-'))) {
      const build = moduleFor(name).buildLevel as () => string[]
      expect(typeof build, name).toBe('function')
      const rows = build()
      expect(Array.isArray(rows), name).toBe(true)
      expect(rows.length, name).toBeGreaterThan(0)
      expect(rows.length, name).toBeLessThanOrEqual(ROWS - 2)
      expect(Math.max(...rows.map((r) => r.length)), name).toBeLessThanOrEqual(COLS)
      expect(buildWorld(rows).warnings, name).toEqual([])
    }
  })

  it('physics presets pull the duck down and cap its fall', () => {
    for (const name of presetNames().filter((n) => n.startsWith('physics-'))) {
      const physics = adaptPhysics(moduleFor(name))
      expect(physics.jumpVelocity, name).toBeLessThan(0)
      expect(physics.applyGravity(0), name).toBeGreaterThan(0)
      // Falling never speeds up without bound.
      expect(physics.applyGravity(1000), name).toBeLessThanOrEqual(32)
    }
  })

  it('a name that is not a preset has no target', () => {
    expect(targetOf('duck-mode')).toBeNull()
  })
})
