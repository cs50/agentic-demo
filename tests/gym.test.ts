/**
 * The Gym battle and the two areas, as rules: no canvas, no hub.
 */
import { describe, expect, it } from 'vitest'
import { AREAS, COLS, GYM, ROWS, YARD, YARD_DOORSTEP } from '../demo/gym/areas'
import { Battle, DUCK_HIT, HIT, MAX_HP, ROUNDS } from '../demo/gym/battle'
import { NPCS } from '../demo/gym/npcs'
import { Overworld } from '../demo/gym/overworld'
import { SLOPPYCLAUDE } from '../demo/gym/sloppyclaude'
import { DUCK_BACK, DUCK_SIDE, STATUE, outlined, personSprite, spriteSize } from '../demo/gym/sprites'
import { EXIT_MAT, GYM_DOOR, GYM_TILES, YARD_TILES } from '../demo/gym/tiles'

const idle = { dx: 0, dy: 0, interact: false }
const hold = (w: Overworld, input: Partial<typeof idle>, frames: number) => {
  for (let i = 0; i < frames; i++) w.tick({ ...idle, ...input })
}
const tap = (w: Overworld) => w.tick({ ...idle, interact: true })
/** A deterministic "random" source: cycles through the given values. */
const cycle = (vals: number[]) => {
  let i = 0
  return () => vals[i++ % vals.length]
}

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
    b.advance() // intro → sendout
    b.advance() // sendout → duckin
    b.advance() // duckin → move
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
    b.advance()
    b.advance()
    expect(b.pollId()).toBe('gym-1#2')
  })

  it('has a line for every phase, and the leader is Henry', () => {
    const b = new Battle()
    b.start()
    expect(b.line()).toMatch(/HENRY would like to battle/)
    b.advance()
    expect(b.line()).toMatch(/sent out SLOPPYCLAUDE/)
    b.advance()
    expect(b.line()).toMatch(/Go! CS50 DUCK/)
    b.advance()
    expect(b.line()).toMatch(/CONFIDENT NONSENSE/)
  })
})

describe('the areas', () => {
  it('are one screen each and every character is a known tile', () => {
    for (const area of Object.values(AREAS)) {
      expect(area.rows).toHaveLength(ROWS)
      for (const row of area.rows) {
        expect(row).toHaveLength(COLS)
        for (const ch of row) expect(area.tiles[ch], `${area.id}: tile "${ch}"`).toBeDefined()
      }
    }
  })

  it('place everyone on open ground, by name', () => {
    for (const area of Object.values(AREAS)) {
      const w = new Overworld()
      w.enter(area.id)
      for (const p of area.npcs) {
        expect(NPCS[p.npc], p.npc).toBeDefined()
        expect(w.isSolid(p.col, p.row) && p.npc !== 'leitner', `${area.id}: ${p.npc}`).toBe(false)
      }
      expect(w.isSolid(area.spawn.col, area.spawn.row)).toBe(false)
    }
  })

  it('the Yard has one two-tile Gym door reachable from the plaza; the Gym has a mat', () => {
    const doors: [number, number][] = []
    YARD.rows.forEach((row, r) => [...row].forEach((ch, c) => ch === GYM_DOOR && doors.push([c, r])))
    expect(doors).toHaveLength(2)
    const w = new Overworld()
    for (const [c, r] of doors) expect(w.isSolid(c, r + 1)).toBe(false)
    expect(GYM.rows.some((row) => row.includes(EXIT_MAT))).toBe(true)
  })
})

describe('walking', () => {
  it('a tile takes eight frames; walls and people block', () => {
    const w = new Overworld(() => 0)
    const start = w.tile
    hold(w, { dy: -1 }, 8)
    expect(w.tile).toEqual({ col: start.col, row: start.row - 1 })
    expect(w.state.moving).toBe(false)

    const blocked = new Overworld(() => 0)
    hold(blocked, { dx: 1 }, 400)
    expect(w.isSolid(blocked.tile.col + 1, blocked.tile.row)).toBe(true)
  })

  it('from the spawn, straight up the path, into the Gym; the mat leads back out', () => {
    const w = new Overworld(() => 0)
    hold(w, { dy: -1 }, 8 * 8) // row 12 → row 4, the plaza
    expect(w.tile).toEqual({ col: 9, row: 4 })
    expect(w.state.area).toBe('yard')
    w.tick({ ...idle, dy: -1 }) // into the doors
    expect(w.state.area).toBe('gym')
    expect(w.tile).toEqual({ col: GYM.spawn.col, row: GYM.spawn.row })
    // Step down onto the mat and out again.
    hold(w, { dy: 1 }, 8)
    expect(w.state.area).toBe('yard')
    expect(w.tile).toEqual({ col: YARD_DOORSTEP.col, row: YARD_DOORSTEP.row })
    expect(w.state.facing).toBe('down')
  })

  it('facing the sign and pressing ✕ reads it without going in', () => {
    const w = new Overworld(() => 0)
    hold(w, { dy: -1 }, 8 * 8)
    tap(w)
    expect(w.state.mode).toMatchObject({ kind: 'talk', speaker: 'Sign' })
    expect(w.state.area).toBe('yard')
  })

  it('talking to the student pages through their lines and closes', () => {
    const w = new Overworld(() => 0)
    hold(w, { dy: -1 }, 8 * 7) // row 5, the cross path
    expect(w.tile).toEqual({ col: 9, row: 5 })
    hold(w, { dx: -1 }, 8) // col 8; the student is at col 7
    w.tick({ ...idle, dx: -1 }) // blocked by them, but now facing left
    expect(w.tile).toEqual({ col: 8, row: 5 })
    tap(w)
    expect(w.state.mode).toMatchObject({ kind: 'talk', speaker: 'Student', index: 0 })
    for (let i = 0; i < NPCS.student.lines.length; i++) tap(w)
    expect(w.state.mode.kind).toBe('walk')
  })

  it('in the Gym, Henry talks and then the battle begins', () => {
    const w = new Overworld(() => 0)
    let battles = 0
    w.onBattle = () => battles++
    w.enter('gym')
    hold(w, { dy: -1 }, 8 * 8) // up to row 3, under the dais
    expect(w.tile).toEqual({ col: 9, row: 3 })
    tap(w)
    expect(w.state.mode).toMatchObject({ kind: 'talk', speaker: 'Gym Leader Henry', then: 'battle' })
    for (let i = 0; i < NPCS.leitner.lines.length; i++) tap(w)
    w.tick(idle)
    expect(w.state.mode.kind).toBe('battle')
    expect(battles).toBe(1)
  })

  it('David wanders, pauses, and never walks into walls, pillars or the duck', () => {
    const w = new Overworld(cycle([0.1, 0.7, 0.3, 0.9, 0.5, 0.2, 0.8]))
    w.enter('gym')
    const seen = new Set<string>()
    let paused = 0
    let prev = ''
    for (let i = 0; i < 60 * 60; i++) {
      w.tick(idle)
      const d = w.state.actors.find((a) => a.id === 'malan')!
      const key = `${Math.round(d.x / 16)},${Math.round(d.y / 16)}`
      if (!d.moving) {
        if (key === prev) paused++
        seen.add(key)
        expect(w.isSolid(Math.round(d.x / 16), Math.round(d.y / 16)), key).toBe(false)
      }
      prev = key
    }
    expect(seen.size).toBeGreaterThan(3) // it went somewhere
    expect(paused).toBeGreaterThan(120) // and stood still long enough to be caught
    const henry = w.state.actors.find((a) => a.id === 'leitner')!
    expect([henry.x / 16, henry.y / 16]).toEqual([9, 2]) // Henry does not wander
  })
})

describe('sprites', () => {
  it('are rectangular, and the outline grows a sprite by one on each side', () => {
    for (const s of [DUCK_BACK, DUCK_SIDE, STATUE, SLOPPYCLAUDE.idleA, SLOPPYCLAUDE.idleB, SLOPPYCLAUDE.hurt]) {
      const { w } = spriteSize(s)
      for (const row of s.rows) expect(row).toHaveLength(w)
    }
    expect(spriteSize(DUCK_SIDE)).toEqual({ w: 16, h: 16 })
    const o = outlined({ rows: ['.a.', 'aaa', '.a.'], palette: { a: '#fff' } })
    expect(o.rows).toEqual(['..§..', '.§a§.', '§aaa§', '.§a§.', '..§..'])
  })

  it('every person frame is 16×16 and every tile 16×16', () => {
    for (const npc of Object.values(NPCS)) {
      for (const facing of ['up', 'down', 'left', 'right'] as const) {
        for (const frame of [0, 1] as const) {
          const { sprite } = personSprite(npc.look, facing, frame)
          expect(sprite.rows, `${npc.id} ${facing} ${frame}`).toHaveLength(16)
          for (const row of sprite.rows) expect(row, `${npc.id} ${facing} ${frame}`).toHaveLength(16)
        }
      }
    }
    for (const tiles of [YARD_TILES, GYM_TILES]) {
      for (const [ch, def] of Object.entries(tiles)) {
        expect(def.sprite.rows, `tile ${ch}`).toHaveLength(16)
        for (const row of def.sprite.rows) expect(row, `tile ${ch}`).toHaveLength(16)
      }
    }
  })
})
