/**
 * overworld.ts — the Yard as a game: tile-to-tile movement, facing, what is
 * in front of the duck, and what happens when ✕ is pressed there.
 *
 * Pure and framework-free, like demo/mario/engine.ts: it is stepped 60 times
 * a second with an input and exposes state for a renderer. No canvas here.
 */

import { GYM_DOOR, STATUE_TILE, TILE, TILES } from './tiles'
import { MAP_COLS, MAP_ROWS, MAP_ROWS_N, SPAWN, VIEW_COLS, VIEW_ROWS } from './map'
import { GYM_DOOR_LINES, NPCS, PLAQUE, type Npc } from './npcs'
import type { Facing } from './sprites'

export interface OverworldInput {
  /** -1, 0, 1 on each axis. */
  dx: number
  dy: number
  /** ✕ pressed this step (edge). */
  interact: boolean
}

/** What the duck is doing, for the renderer and the component. */
export type Mode =
  | { kind: 'walk' }
  | { kind: 'talk'; speaker: string; lines: string[]; index: number }
  | { kind: 'gym' } // standing at the door, challenge accepted

export interface OverworldState {
  /** Duck position in pixels (top-left of its tile). */
  x: number
  y: number
  facing: Facing
  /** 0/1 while walking, for the two-frame animation. */
  frame: 0 | 1
  moving: boolean
  camera: { x: number; y: number }
  mode: Mode
}

const STEP_FRAMES = 8 // frames to cross one tile
const DIRS: Record<Facing, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
}

export function tileAt(col: number, row: number): string {
  if (row < 0 || row >= MAP_ROWS_N || col < 0 || col >= MAP_COLS) return 'T'
  return MAP_ROWS[row][col]
}

export function isSolid(col: number, row: number): boolean {
  const def = TILES[tileAt(col, row)]
  return def ? def.solid : true
}

export function npcAt(col: number, row: number): Npc | undefined {
  return NPCS.find((n) => n.col === col && n.row === row)
}

export class Overworld {
  private col = SPAWN.col
  private row = SPAWN.row
  private facing: Facing = SPAWN.facing
  /** Progress across the current tile move, 0..STEP_FRAMES; 0 = standing. */
  private progress = 0
  private from = { col: SPAWN.col, row: SPAWN.row }
  private walkClock = 0
  private mode: Mode = { kind: 'walk' }
  /** Set when the duck reaches the Gym door; the component starts the battle. */
  onGym: (() => void) | null = null

  reset() {
    this.col = SPAWN.col
    this.row = SPAWN.row
    this.facing = SPAWN.facing
    this.progress = 0
    this.from = { col: SPAWN.col, row: SPAWN.row }
    this.mode = { kind: 'walk' }
  }

  /** The tile the duck is facing. */
  private ahead() {
    const d = DIRS[this.facing]
    return { col: this.col + d.dc, row: this.row + d.dr }
  }

  step(input: OverworldInput) {
    if (this.mode.kind === 'talk') {
      if (input.interact) {
        const m = this.mode
        if (m.index + 1 < m.lines.length) this.mode = { ...m, index: m.index + 1 }
        else this.mode = { kind: 'walk' }
      }
      return
    }
    if (this.mode.kind === 'gym') return

    // Mid-move: keep going.
    if (this.progress > 0) {
      this.progress++
      this.walkClock++
      if (this.progress >= STEP_FRAMES) {
        this.progress = 0
        this.from = { col: this.col, row: this.row }
      }
      return
    }

    if (input.interact) {
      const a = this.ahead()
      const npc = npcAt(a.col, a.row)
      if (npc) {
        this.mode = { kind: 'talk', speaker: npc.name, lines: npc.lines, index: 0 }
        return
      }
      const t = tileAt(a.col, a.row)
      if (t === STATUE_TILE) {
        this.mode = { kind: 'talk', speaker: 'Plaque', lines: PLAQUE, index: 0 }
        return
      }
      if (t === GYM_DOOR) {
        this.mode = { kind: 'gym' }
        this.onGym?.()
        return
      }
    }

    // Start a move if a direction is held.
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
    const t = tileAt(nc, nr)
    if (t === GYM_DOOR) {
      // Walking into the door is the same as knocking.
      this.mode = { kind: 'talk', speaker: 'Door', lines: GYM_DOOR_LINES, index: 0 }
      this.pendingGym = true
      return
    }
    if (isSolid(nc, nr) || npcAt(nc, nr)) return
    this.from = { col: this.col, row: this.row }
    this.col = nc
    this.row = nr
    this.progress = 1
    this.walkClock++
  }

  /** After the door's lines, the next ✕ is the challenge. */
  private pendingGym = false

  /** Called by the component each step after `step()`, to turn "door lines finished" into the gym. */
  private resolvePendingGym() {
    if (this.pendingGym && this.mode.kind === 'walk') {
      this.pendingGym = false
      this.mode = { kind: 'gym' }
      this.onGym?.()
    }
  }

  /** One frame: input, then bookkeeping. */
  tick(input: OverworldInput) {
    this.step(input)
    this.resolvePendingGym()
  }

  /** Where the duck stands or is heading, in tiles. */
  get tile() {
    return { col: this.col, row: this.row }
  }

  get state(): OverworldState {
    const t = this.progress / STEP_FRAMES
    const x = (this.from.col + (this.col - this.from.col) * t) * TILE
    const y = (this.from.row + (this.row - this.from.row) * t) * TILE
    const camX = clamp(x + TILE / 2 - (VIEW_COLS * TILE) / 2, 0, (MAP_COLS - VIEW_COLS) * TILE)
    const camY = clamp(y + TILE / 2 - (VIEW_ROWS * TILE) / 2, 0, (MAP_ROWS_N - VIEW_ROWS) * TILE)
    return {
      x,
      y,
      facing: this.facing,
      frame: Math.floor(this.walkClock / 6) % 2 === 0 ? 0 : 1,
      moving: this.progress > 0,
      camera: { x: Math.round(camX), y: Math.round(camY) },
      mode: this.mode,
    }
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}
