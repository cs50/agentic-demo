/**
 * The Gym battle and the Yard, as rules: no canvas, no hub.
 */
import { describe, expect, it } from 'vitest'
import { Battle, DUCK_HIT, HIT, MAX_HP, ROUNDS } from '../demo/gym/battle'
import { MAP_COLS, MAP_ROWS, SPAWN } from '../demo/gym/map'
import { NPCS } from '../demo/gym/npcs'
import { Overworld, isSolid, tileAt } from '../demo/gym/overworld'
import { SLOPWHALE } from '../demo/gym/slopwhale'
import { DUCK_BACK, PERSON, STATUE, spriteSize } from '../demo/gym/sprites'
import { GYM_DOOR, TILES } from '../demo/gym/tiles'

const idle = { dx: 0, dy: 0, interact: false }

describe('the rounds', () => {
  it('cover the ten concepts once each, with unique poll ids and a valid answer', () => {
    const concepts = ROUNDS.flatMap((r) => r.concepts)
    expect(concepts).toHaveLength(10)
    expect(new Set(concepts).size).toBe(10)
    expect(new Set(ROUNDS.map((r) => r.id)).size).toBe(ROUNDS.length)
    for (const r of ROUNDS) {
      expect(r.options.length).toBeGreaterThanOrEqual(2)
      expect(r.options.length).toBeLessThanOrEqual(8) // the hub's MAX_OPTIONS
      expect(r.correct).toBeGreaterThanOrEqual(0)
      expect(r.correct).toBeLessThan(r.options.length)
    }
  })
})

describe('the battle', () => {
  function play(answers: boolean[]) {
    const b = new Battle()
    b.start()
    b.advance() // intro → move
    for (const right of answers) {
      expect(b.advance()).toBe(true) // move → question (open the poll)
      const r = b.state.round!
      b.pollClosed(right ? r.correct : (r.correct + 1) % r.options.length, 40)
      expect(b.state.phase).toBe('resolve')
      b.advance() // → explain
      b.advance() // → next move, or won/lost
      if (b.state.phase === 'won' || b.state.phase === 'lost') break
    }
    return b
  }

  it('a room that is always right wins after four rounds', () => {
    const b = play([true, true, true, true, true])
    expect(b.state.phase).toBe('won')
    expect(b.state.monsterHp).toBe(0)
    expect(b.state.duckHp).toBe(MAX_HP)
    expect(b.state.roundIndex).toBe(3)
    expect(b.state.score).toBe(4)
  })

  it('a room that is always wrong loses after three', () => {
    const b = play([false, false, false, false, false])
    expect(b.state.phase).toBe('lost')
    expect(b.state.duckHp).toBe(0)
    expect(b.state.monsterHp).toBe(MAX_HP)
  })

  it('with the moves exhausted, more HP wins', () => {
    const b = play([true, false, true, false, true])
    expect(b.state.phase).toBe('won')
    expect(b.state.monsterHp).toBe(MAX_HP - 3 * HIT)
    expect(b.state.duckHp).toBe(MAX_HP - 2 * DUCK_HIT)
  })

  it('ignores an answer outside the question phase and ✕ during it', () => {
    const b = new Battle()
    b.start()
    b.pollClosed(0, 10)
    expect(b.state.phase).toBe('intro')
    b.advance()
    b.advance()
    expect(b.state.phase).toBe('question')
    expect(b.advance()).toBe(false)
    expect(b.state.phase).toBe('question')
  })

  it('a rematch gets fresh HP and distinct poll ids', () => {
    const b = play([false, false, false])
    expect(b.state.phase).toBe('lost')
    b.start()
    expect(b.state.monsterHp).toBe(MAX_HP)
    expect(b.state.attempt).toBe(1)
    b.advance()
    expect(b.pollId()).toBe('gym-1#2')
  })

  it('has a line for every phase', () => {
    const b = new Battle()
    b.start()
    expect(b.line()).toMatch(/battle/)
    b.advance()
    expect(b.line()).toMatch(/CONFIDENT NONSENSE/)
  })
})

describe('the Yard', () => {
  it('is rectangular and every character is a known tile', () => {
    for (const row of MAP_ROWS) {
      expect(row).toHaveLength(MAP_COLS)
      for (const ch of row) expect(TILES[ch], `tile "${ch}"`).toBeDefined()
    }
  })

  it('has exactly one Gym door pair, walkable from below', () => {
    const doors: [number, number][] = []
    MAP_ROWS.forEach((row, r) => [...row].forEach((ch, c) => ch === GYM_DOOR && doors.push([c, r])))
    expect(doors).toHaveLength(2)
    for (const [c, r] of doors) expect(isSolid(c, r + 1)).toBe(false)
  })

  it('spawns the duck on open ground, and NPCs stand on open ground too', () => {
    expect(isSolid(SPAWN.col, SPAWN.row)).toBe(false)
    for (const n of NPCS) expect(isSolid(n.col, n.row), n.id).toBe(false)
  })

  it('the duck walks a tile in eight frames and stops at walls and people', () => {
    const w = new Overworld()
    const start = w.tile
    w.tick({ ...idle, dy: -1 })
    for (let i = 0; i < 7; i++) w.tick(idle)
    expect(w.tile).toEqual({ col: start.col, row: start.row - 1 })
    expect(w.state.moving).toBe(false)

    // Walk into the tree at the right edge: no progress.
    const blocked = new Overworld()
    for (let i = 0; i < 400; i++) blocked.tick({ ...idle, dx: 1 })
    expect(tileAt(blocked.tile.col + 1, blocked.tile.row)).toBe('T')
  })

  it('talking to someone opens their lines; ✕ pages through and closes', () => {
    const w = new Overworld()
    // Teleport-free: walk the duck to the tile below the professor is long; instead test the plaque from the tourist's side.
    const npc = NPCS.find((n) => n.id === 'student')!
    // Place by walking: student at (14,12), path row 12/13 is open. Walk up from spawn to row 13, then left to col 14.
    for (let i = 0; i < 11 * 8; i++) w.tick({ ...idle, dy: -1 })
    expect(w.tile.row).toBe(13)
    while (w.tile.col > npc.col) for (let i = 0; i < 8; i++) w.tick({ ...idle, dx: -1 })
    expect(w.tile).toEqual({ col: npc.col, row: 13 })
    w.tick({ ...idle, dy: -1 }) // face up, into the student: blocked, but facing changes
    expect(w.state.facing).toBe('up')
    w.tick({ ...idle, interact: true })
    expect(w.state.mode).toMatchObject({ kind: 'talk', speaker: npc.name, index: 0 })
    for (let i = 0; i < npc.lines.length; i++) w.tick({ ...idle, interact: true })
    expect(w.state.mode.kind).toBe('walk')
  })

  it('walking into the Gym door reads the sign, and ✕ then challenges', () => {
    const w = new Overworld()
    let gym = 0
    w.onGym = () => gym++
    for (let i = 0; i < 16 * 8 + 8; i++) w.tick({ ...idle, dy: -1 })
    expect(w.tile.row).toBe(8) // the plaza under the door
    w.tick({ ...idle, dy: -1 })
    expect(w.state.mode.kind).toBe('talk')
    w.tick({ ...idle, interact: true })
    w.tick({ ...idle, interact: true })
    expect(w.state.mode.kind).toBe('gym')
    expect(gym).toBe(1)
  })
})

describe('sprites', () => {
  it('are rectangular', () => {
    for (const s of [DUCK_BACK, PERSON, STATUE, SLOPWHALE.idleA, SLOPWHALE.idleB, SLOPWHALE.hurt]) {
      const { w } = spriteSize(s)
      for (const row of s.rows) expect(row).toHaveLength(w)
    }
    for (const [ch, def] of Object.entries(TILES)) {
      for (const row of def.sprite.rows) expect(row, `tile ${ch}`).toHaveLength(16)
      expect(def.sprite.rows, `tile ${ch}`).toHaveLength(16)
    }
  })
})
