/**
 * overworld.ts — the Yard and the Gym as a game: tile-to-tile movement,
 * facing, what is in front of the duck, what ✕ does there, doors between the
 * two areas, and people who walk about on their own.
 *
 * Pure and framework-free, like demo/mario/engine.ts: stepped 60 times a
 * second with an input, exposing state for a renderer. No canvas here. The
 * random source is injectable so tests are deterministic.
 */

import { AREAS, YARD_DOORSTEP, type Area, type Placement } from './areas'
import { EXIT_MAT, GYM_DOOR, STATUE_TILE, TILE } from './tiles'
import { GYM_DOOR_LINES, NPCS, PLAQUE, type Npc } from './npcs'
import type { Facing } from './sprites'

export interface OverworldInput {
  /** -1, 0, 1 on each axis. */
  dx: number
  dy: number
  /** ✕ pressed this step (edge). */
  interact: boolean
}

export type Mode =
  | { kind: 'walk' }
  | { kind: 'talk'; speaker: string; lines: string[]; index: number; then?: 'battle' }
  | { kind: 'battle' }

/** A person as placed and moving. */
export interface Actor {
  npc: Npc
  col: number
  row: number
  from: { col: number; row: number }
  progress: number
  facing: Facing
  /** Frames until a wandering NPC considers moving again. */
  rest: number
  /** Tiles left in the current stroll. */
  strollLeft: number
}

export interface ActorView {
  id: string
  x: number
  y: number
  facing: Facing
  frame: 0 | 1
  moving: boolean
}

export interface OverworldState {
  area: Area['id']
  /** Duck position in pixels (top-left of its tile). */
  x: number
  y: number
  facing: Facing
  frame: 0 | 1
  moving: boolean
  actors: ActorView[]
  mode: Mode
  /** Frames since an area change; the renderer fades in from it. */
  sinceEnter: number
}

const STEP_FRAMES = 8 // frames to cross one tile
const DIRS: Record<Facing, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
}
const FACINGS: Facing[] = ['up', 'down', 'left', 'right']

export class Overworld {
  area: Area = AREAS.yard
  private col = 0
  private row = 0
  private facing: Facing = 'up'
  private from = { col: 0, row: 0 }
  private progress = 0
  private walkClock = 0
  private mode: Mode = { kind: 'walk' }
  private actors: Actor[] = []
  private sinceEnter = 0
  private pendingBattle = false

  /** Called when the leader's lines end: the component starts the battle. */
  onBattle: (() => void) | null = null

  constructor(private rng: () => number = Math.random) {
    this.enter('yard')
  }

  /** Go to an area, standing at its spawn (or somewhere given). */
  enter(id: Area['id'], at?: { col: number; row: number; facing: Facing }) {
    this.area = AREAS[id]
    const s = at ?? this.area.spawn
    this.col = s.col
    this.row = s.row
    this.facing = s.facing
    this.from = { col: s.col, row: s.row }
    this.progress = 0
    this.mode = { kind: 'walk' }
    this.sinceEnter = 0
    this.actors = this.area.npcs.map((p) => placeActor(p))
  }

  reset() {
    this.enter('yard')
  }

  // ---------------------------------------------------------------- queries

  tileAt(col: number, row: number): string {
    const row_ = this.area.rows[row]
    if (!row_ || col < 0 || col >= row_.length) return '\0'
    return row_[col]
  }

  isSolid(col: number, row: number): boolean {
    const def = this.area.tiles[this.tileAt(col, row)]
    return def ? def.solid : true
  }

  actorAt(col: number, row: number): Actor | undefined {
    return this.actors.find((a) => (a.col === col && a.row === row) || (a.progress > 0 && a.from.col === col && a.from.row === row))
  }

  /** Free for someone to step onto: not solid, nobody there, not the duck. */
  private isFree(col: number, row: number): boolean {
    if (this.isSolid(col, row)) return false
    if (this.actorAt(col, row)) return false
    if ((this.col === col && this.row === row) || (this.progress > 0 && this.from.col === col && this.from.row === row)) return false
    return true
  }

  private ahead() {
    const d = DIRS[this.facing]
    return { col: this.col + d.dc, row: this.row + d.dr }
  }

  // ------------------------------------------------------------------ step

  /** One frame. */
  tick(input: OverworldInput) {
    this.sinceEnter++
    this.stepDuck(input)
    if (this.mode.kind === 'walk') this.stepActors()
    if (this.pendingBattle && this.mode.kind === 'walk') {
      this.pendingBattle = false
      this.mode = { kind: 'battle' }
      this.onBattle?.()
    }
  }

  private stepDuck(input: OverworldInput) {
    if (this.mode.kind === 'talk') {
      if (input.interact) {
        const m = this.mode
        if (m.index + 1 < m.lines.length) this.mode = { ...m, index: m.index + 1 }
        else {
          this.mode = { kind: 'walk' }
          if (m.then === 'battle') this.pendingBattle = true
        }
      }
      return
    }
    if (this.mode.kind === 'battle') return

    if (this.progress > 0) {
      this.progress++
      this.walkClock++
      if (this.progress >= STEP_FRAMES) {
        this.progress = 0
        this.from = { col: this.col, row: this.row }
        this.arrived()
      }
      return
    }

    if (input.interact) {
      const a = this.ahead()
      const actor = this.actorAt(a.col, a.row)
      if (actor) {
        actor.facing = opposite(this.facing)
        this.mode = { kind: 'talk', speaker: actor.npc.name, lines: actor.npc.lines, index: 0, then: actor.npc.leader ? 'battle' : undefined }
        return
      }
      const t = this.tileAt(a.col, a.row)
      if (this.area.id === 'yard' && t === STATUE_TILE) {
        this.mode = { kind: 'talk', speaker: 'Plaque', lines: PLAQUE, index: 0 }
        return
      }
      if (this.area.id === 'yard' && t === GYM_DOOR) {
        this.mode = { kind: 'talk', speaker: 'Sign', lines: GYM_DOOR_LINES, index: 0 }
        return
      }
    }

    let facing: Facing | null = null
    if (input.dy < 0) facing = 'up'
    else if (input.dy > 0) facing = 'down'
    else if (input.dx < 0) facing = 'left'
    else if (input.dx > 0) facing = 'right'
    if (!facing) {
      this.walkClock = 0
      return
    }
    this.facing = facing
    const d = DIRS[facing]
    const nc = this.col + d.dc
    const nr = this.row + d.dr
    if (this.area.id === 'yard' && this.tileAt(nc, nr) === GYM_DOOR) {
      this.enter('gym')
      return
    }
    if (this.isSolid(nc, nr) || this.actorAt(nc, nr)) return
    this.from = { col: this.col, row: this.row }
    this.col = nc
    this.row = nr
    this.progress = 1
    this.walkClock++
  }

  /** The duck has finished a step onto its tile. */
  private arrived() {
    if (this.area.id === 'gym' && this.tileAt(this.col, this.row) === EXIT_MAT) {
      this.enter('yard', YARD_DOORSTEP)
    }
  }

  private stepActors() {
    for (const a of this.actors) {
      if (a.progress > 0) {
        a.progress++
        if (a.progress >= STEP_FRAMES) {
          a.progress = 0
          a.from = { col: a.col, row: a.row }
        }
        continue
      }
      if (!a.npc.wander) continue
      if (a.rest > 0) {
        a.rest--
        continue
      }
      if (a.strollLeft <= 0) {
        // Stroll is over: stand still for two to five seconds, then plan another.
        a.rest = 120 + Math.floor(this.rng() * 180)
        a.strollLeft = 1 + Math.floor(this.rng() * 3)
        a.facing = FACINGS[Math.floor(this.rng() * 4)]
        continue
      }
      const d = DIRS[a.facing]
      const nc = a.col + d.dc
      const nr = a.row + d.dr
      if (this.isFree(nc, nr)) {
        a.from = { col: a.col, row: a.row }
        a.col = nc
        a.row = nr
        a.progress = 1
        a.strollLeft--
      } else {
        // Blocked: turn, and count it as the end of this stroll.
        a.facing = FACINGS[Math.floor(this.rng() * 4)]
        a.strollLeft = 0
      }
    }
  }

  // ----------------------------------------------------------------- view

  get tile() {
    return { col: this.col, row: this.row }
  }

  get state(): OverworldState {
    const t = this.progress / STEP_FRAMES
    return {
      area: this.area.id,
      x: (this.from.col + (this.col - this.from.col) * t) * TILE,
      y: (this.from.row + (this.row - this.from.row) * t) * TILE,
      facing: this.facing,
      frame: Math.floor(this.walkClock / 6) % 2 === 0 ? 0 : 1,
      moving: this.progress > 0,
      actors: this.actors.map((a) => {
        const u = a.progress / STEP_FRAMES
        return {
          id: a.npc.id,
          x: (a.from.col + (a.col - a.from.col) * u) * TILE,
          y: (a.from.row + (a.row - a.from.row) * u) * TILE,
          facing: a.facing,
          frame: a.progress > 0 && a.progress % 8 >= 4 ? 1 : 0,
          moving: a.progress > 0,
        }
      }),
      mode: this.mode,
      sinceEnter: this.sinceEnter,
    }
  }
}

function placeActor(p: Placement): Actor {
  const npc = NPCS[p.npc]
  if (!npc) throw new Error(`unknown npc "${p.npc}"`)
  return { npc, col: p.col, row: p.row, from: { col: p.col, row: p.row }, progress: 0, facing: p.facing ?? 'down', rest: 60, strollLeft: 0 }
}

function opposite(f: Facing): Facing {
  return f === 'up' ? 'down' : f === 'down' ? 'up' : f === 'left' ? 'right' : 'left'
}
