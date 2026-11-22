/**
 * engine.ts — fixed-timestep 60 FPS game loop, AABB tile collision, rendering.
 *
 * Physics invariants (from the lecture spec):
 *   gravity:       0.8 px/frame²
 *   jump velocity: -14 px/frame
 *   frame rate:    60 FPS (fixed timestep, independent of display refresh)
 */

import { Controller, type ControllerState } from './controller'
import { TILE, isSolid, type World } from './world'

export const FPS = 60
export const STEP_MS = 1000 / FPS
export const GRAVITY = 0.8
export const JUMP_VELOCITY = -14
export const MOVE_SPEED = 4.5
export const MAX_FALL = 16

const PLAYER_W = 24
const PLAYER_H = 30

const COLORS = {
  bg: '#0f172a',
  fg: '#f8fafc',
  cyan: '#38bdf8',
  emerald: '#34d399',
  ground: '#1e293b',
  groundTop: '#334155',
  muted: '#64748b',
}

interface Player {
  x: number
  y: number
  vx: number
  vy: number
  onGround: boolean
  facing: 1 | -1
}

export interface EngineStats {
  fps: number
  frames: number
  controller: ControllerState
  /** Incremented every time the level is hot-swapped. */
  levelVersion: number
  levelWarnings: string[]
}

export class Engine {
  readonly controller = new Controller()
  world: World
  private player: Player
  private ctx: CanvasRenderingContext2D | null = null
  private raf = 0
  private last = 0
  private acc = 0
  private running = false
  private frames = 0
  private levelVersion = 0
  private fpsCounter = { t: 0, n: 0, value: 0 }
  private lastState: ControllerState = {
    connected: false,
    moveX: 0,
    jumpPressed: false,
    jumpHeld: false,
    source: 'none',
  }
  private onStats?: (s: EngineStats) => void

  constructor(world: World) {
    this.world = world
    this.player = this.spawnPlayer()
  }

  /**
   * Find the lowest free standing position at column `x` whose feet are at or
   * above `y`, checking the player's full bounding box. Returns null only if
   * every row up to and including the top row is blocked (buildWorld always
   * keeps the top row free, so in practice this always succeeds).
   */
  private findFreeYAbove(x: number, y: number): number | null {
    let feetRow = Math.ceil((y + PLAYER_H) / TILE) - 1
    for (; feetRow >= 0; feetRow--) {
      const candidate = (feetRow + 1) * TILE - PLAYER_H
      if (!this.collides(x, candidate)) return candidate
    }
    return null
  }

  private spawnPlayer(): Player {
    const { x, y } = this.world.spawn
    // A tall level can bury the fixed spawn point; lift it to the first free row.
    const safeY = this.collides(x, y) ? (this.findFreeYAbove(x, y) ?? 0) : y
    return { x, y: safeY, vx: 0, vy: 0, onGround: false, facing: 1 }
  }

  /**
   * Hot-swap the level while the game is running. The player keeps their
   * position unless the new level puts a block where they are standing, in
   * which case they are lifted to the nearest free row above (or respawned).
   */
  setWorld(world: World) {
    this.world = world
    this.levelVersion++
    const p = this.player
    if (this.collides(p.x, p.y)) {
      const y = this.findFreeYAbove(p.x, p.y)
      if (y !== null) {
        p.y = y
        p.vy = 0
      } else {
        this.player = this.spawnPlayer()
      }
    }
  }

  /** Read-only snapshot for diagnostics / tests. */
  get playerState() {
    return { ...this.player }
  }

  start(canvas: HTMLCanvasElement, onStats?: (s: EngineStats) => void) {
    this.stop()
    canvas.width = this.world.cols * TILE
    canvas.height = this.world.rows * TILE
    this.ctx = canvas.getContext('2d')
    this.onStats = onStats
    this.controller.attachKeyboard(canvas)
    this.running = true
    this.last = performance.now()
    this.acc = 0
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.controller.detachKeyboard()
  }

  reset() {
    this.player = this.spawnPlayer()
  }

  private frame = (now: number) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)

    // Fixed timestep: advance physics in exact 1/60s increments.
    let delta = now - this.last
    this.last = now
    if (delta > 250) delta = 250 // tab was hidden; don't spiral
    this.acc += delta

    while (this.acc >= STEP_MS) {
      this.lastState = this.controller.poll()
      this.update(this.lastState)
      this.acc -= STEP_MS
      this.frames++
      this.fpsCounter.n++ // count simulation steps, not display refreshes
    }

    // Simulation rate over 500ms windows (should read 60 regardless of monitor Hz).
    if (now - this.fpsCounter.t >= 500) {
      this.fpsCounter.value = Math.round((this.fpsCounter.n * 1000) / (now - this.fpsCounter.t))
      this.fpsCounter.t = now
      this.fpsCounter.n = 0
    }

    this.render()
    this.onStats?.({
      fps: this.fpsCounter.value,
      frames: this.frames,
      controller: this.lastState,
      levelVersion: this.levelVersion,
      levelWarnings: this.world.warnings,
    })
  }

  // ---------------------------------------------------------------- physics

  private update(input: ControllerState) {
    const p = this.player

    p.vx = input.moveX * MOVE_SPEED
    if (input.moveX !== 0) p.facing = input.moveX > 0 ? 1 : -1

    if (input.jumpPressed && p.onGround) {
      p.vy = JUMP_VELOCITY
      p.onGround = false
    }

    p.vy = Math.min(p.vy + GRAVITY, MAX_FALL)

    // Horizontal move + resolve
    p.x += p.vx
    this.resolveX(p)

    // Vertical move + resolve
    p.y += p.vy
    this.resolveY(p)

    // Fell off the world? Respawn.
    if (p.y > this.world.rows * TILE + 200) this.reset()
  }

  /**
   * The player occupies the half-open box [x, x+W) × [y, y+H).
   * Using ceil(...) - 1 for the far edge is correct for fractional positions;
   * the naive `floor(y + H - 1)` lets the player hover a sub-pixel above a
   * tile and makes `onGround` flicker between frames.
   */
  private collides(x: number, y: number): boolean {
    const c0 = Math.floor(x / TILE)
    const c1 = Math.ceil((x + PLAYER_W) / TILE) - 1
    const r0 = Math.floor(y / TILE)
    const r1 = Math.ceil((y + PLAYER_H) / TILE) - 1
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (isSolid(this.world, c, r)) return true
      }
    }
    return false
  }

  private resolveX(p: Player) {
    if (!this.collides(p.x, p.y)) return
    if (p.vx > 0) {
      const c = Math.ceil((p.x + PLAYER_W) / TILE) - 1
      p.x = c * TILE - PLAYER_W
    } else if (p.vx < 0) {
      const c = Math.floor(p.x / TILE)
      p.x = (c + 1) * TILE
    }
    p.vx = 0
  }

  private resolveY(p: Player) {
    p.onGround = false
    if (!this.collides(p.x, p.y)) return
    if (p.vy > 0) {
      const r = Math.ceil((p.y + PLAYER_H) / TILE) - 1
      p.y = r * TILE - PLAYER_H
      p.onGround = true
    } else if (p.vy < 0) {
      const r = Math.floor(p.y / TILE)
      p.y = (r + 1) * TILE
    }
    p.vy = 0
  }

  // -------------------------------------------------------------- rendering

  private render() {
    const ctx = this.ctx
    if (!ctx) return
    const { cols, rows, groundRow } = this.world
    const W = cols * TILE
    const H = rows * TILE

    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, W, H)

    // Subtle grid to echo the terminal origin
    ctx.strokeStyle = 'rgba(148,163,184,0.06)'
    ctx.lineWidth = 1
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath()
      ctx.moveTo(c * TILE + 0.5, 0)
      ctx.lineTo(c * TILE + 0.5, H)
      ctx.stroke()
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * TILE + 0.5)
      ctx.lineTo(W, r * TILE + 0.5)
      ctx.stroke()
    }

    // Tiles
    ctx.font = `bold ${TILE * 0.8}px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!this.world.solids.has(`${c},${r}`)) continue
        const x = c * TILE
        const y = r * TILE
        if (r === groundRow) {
          ctx.fillStyle = COLORS.ground
          ctx.fillRect(x, y, TILE, TILE)
          ctx.fillStyle = COLORS.groundTop
          ctx.fillRect(x, y, TILE, 4)
        } else {
          // Pyramid block: a '#' glyph on an emerald tile
          ctx.fillStyle = 'rgba(52,211,153,0.18)'
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2)
          ctx.strokeStyle = COLORS.emerald
          ctx.lineWidth = 1.5
          ctx.strokeRect(x + 1.5, y + 1.5, TILE - 3, TILE - 3)
          ctx.fillStyle = COLORS.emerald
          ctx.fillText('#', x + TILE / 2, y + TILE / 2 + 1)
        }
      }
    }

    // Player
    const p = this.player
    ctx.fillStyle = COLORS.cyan
    ctx.fillRect(Math.round(p.x), Math.round(p.y), PLAYER_W, PLAYER_H)
    // Cap
    ctx.fillStyle = '#0ea5e9'
    ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y), PLAYER_W + 4, 6)
    // Eye (shows facing direction)
    ctx.fillStyle = COLORS.bg
    const eyeX = p.facing === 1 ? p.x + PLAYER_W - 8 : p.x + 4
    ctx.fillRect(Math.round(eyeX), Math.round(p.y) + 10, 4, 4)
  }
}
