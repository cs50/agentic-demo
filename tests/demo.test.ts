/**
 * The live demo's two states must both be known to work before the lecture:
 *   start/     what the room sees first (no gravity, no pyramid)
 *   solutions/ what `pnpm demo solve` copies in if the agent fails on stage
 * And the committed live files must equal the start versions, so a fresh
 * checkout is ready to present (`pnpm demo reset` if this fails).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Engine, HURT_STEPS } from '../demo/mario/engine'
import { adaptPhysics } from '../demo/mario/livePhysics'
import * as startLevel from '../demo/mario/start/level'
import * as startPhysics from '../demo/mario/start/physics'
import * as solvedLevel from '../demo/mario/solutions/level'
import * as solvedPhysics from '../demo/mario/solutions/physics'
import { ROWS, TILE, buildWorld } from '../demo/mario/world'
import type { ControllerState } from '../demo/mario/controller'

const root = resolve(import.meta.dirname, '..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')

const idle: ControllerState = { connected: false, moveX: 0, jumpPressed: false, jumpHeld: false, source: 'none' }
const jump: ControllerState = { ...idle, jumpPressed: true, jumpHeld: true }

describe('start state', () => {
  it('level.ts has no rows', () => {
    expect(startLevel.buildLevel()).toEqual([])
  })

  it('physics.ts never changes the vertical speed', () => {
    const physics = adaptPhysics(startPhysics)
    expect(physics.jumpVelocity).toBe(-14)
    for (const vy of [-14, -1, 0, 5]) expect(physics.applyGravity(vy)).toBe(vy)
  })

  it('the duck stands on the ground, and a jump sends it out of the level', () => {
    const engine = new Engine(buildWorld(startLevel.buildLevel()), adaptPhysics(startPhysics))
    expect(engine.playerState.onGround).toBe(true)
    engine.step(jump)
    for (let i = 0; i < 120 && !engine.hurtState; i++) engine.step(idle)
    expect(engine.hurtState?.where).toBe('top')
    // ...and comes back after HURT_STEPS, standing again.
    for (let i = 0; i < HURT_STEPS; i++) engine.step(idle)
    expect(engine.hurtState).toBeNull()
    expect(engine.playerState.onGround).toBe(true)
  })

  it('is what the live files contain', () => {
    expect(read('demo/mario/level.ts')).toBe(read('demo/mario/start/level.ts'))
    expect(read('demo/mario/physics.ts')).toBe(read('demo/mario/start/physics.ts'))
  })
})

describe('solutions', () => {
  it('level.ts is the eight-row right-aligned pyramid', () => {
    const rows = solvedLevel.buildLevel()
    expect(rows).toHaveLength(8)
    rows.forEach((row, i) => {
      expect(row).toBe(' '.repeat(7 - i) + '#'.repeat(i + 1))
    })
  })

  it('physics.ts accelerates downward to a terminal velocity', () => {
    const physics = adaptPhysics(solvedPhysics)
    expect(physics.jumpVelocity).toBe(-14)
    expect(physics.applyGravity(0)).toBeCloseTo(0.8)
    expect(physics.applyGravity(-14)).toBeCloseTo(-13.2)
    expect(physics.applyGravity(100)).toBe(16)
  })

  it('a jump lands back on the ground', () => {
    const engine = new Engine(buildWorld(solvedLevel.buildLevel()), adaptPhysics(solvedPhysics))
    const startY = engine.playerState.y
    engine.step(jump)
    expect(engine.playerState.vy).toBeLessThan(0)
    let peak = startY
    for (let i = 0; i < 120; i++) {
      engine.step(idle)
      peak = Math.min(peak, engine.playerState.y)
    }
    expect(peak).toBeLessThan(startY) // it did go up
    expect(engine.playerState.y).toBe(startY) // and came back down to where it stood
    expect(engine.playerState.onGround).toBe(true)
    expect(engine.hurtState).toBeNull()
    expect(startY).toBeLessThan((ROWS - 1) * TILE)
  })
})

describe('adaptPhysics', () => {
  it('rejects a module without applyGravity', () => {
    expect(() => adaptPhysics({})).toThrow(/applyGravity/)
  })
  it('rejects applyGravity that does not return a number', () => {
    expect(() => adaptPhysics({ applyGravity: () => undefined })).toThrow(/not a number/)
    expect(() => adaptPhysics({ applyGravity: () => NaN })).toThrow(/not a number/)
  })
  it('falls back to -14 when JUMP_VELOCITY is missing', () => {
    expect(adaptPhysics({ applyGravity: (v: number) => v }).jumpVelocity).toBe(-14)
  })
})
