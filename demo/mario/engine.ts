/**
 * engine.ts — fixed-timestep 60 FPS game loop, AABB tile collision, rendering.
 *
 * The engine owns the loop, the collision and the drawing. Two things are
 * handed to it and can be swapped while it runs: the World (from level.ts via
 * world.ts) and the Physics (from physics.ts). The frame rate is fixed at 60
 * steps per second regardless of the display's refresh rate.
 */

import { Controller, type ControllerState } from './controller'
import { DUCK_COLS, DUCK_ROWS_N, drawDuck } from './duck'
import { TILE, isSolid, type World } from './world'

export const FPS = 60
export const STEP_MS = 1000 / FPS
export const MOVE_SPEED = 4.5

/** What physics.ts provides. See livePhysics.ts for how it is loaded and checked. */
export interface Physics {
  /** Called once per step with the vertical speed (px/frame, negative is up); returns the new one. */
  applyGravity: (vy: number) => number
  /** The vertical speed a jump starts with. */
  jumpVelocity: number
}

/** How long the duck stays out of play after leaving the level, in steps. */
export const HURT_STEPS = 150

/** The player is the CS50 duck sprite at 2 device pixels per sprite pixel. */
const DUCK_SCALE = 2
const PLAYER_W = DUCK_COLS * DUCK_SCALE // 28
const PLAYER_H = DUCK_ROWS_N * DUCK_SCALE // 28

const COLORS = {
  bg: '#ffffff',
  grid: 'rgba(33, 37, 41, 0.06)',
  ground: '#e9ecef',
  groundTop: '#adb5bd',
  blockFill: 'rgba(165, 28, 48, 0.08)',
  blockStroke: '#a51c30',
  blockGlyph: '#a51c30',
}

interface Player {
  x: number
  y: number
  vx: number
  vy: number
  onGround: boolean
  facing: 1 | -1
}

/** The duck has left the level and is waiting to be put back. */
interface Hurt {
  /** Steps remaining before respawn. */
  left: number
  /** Which way it went. */
  where: 'top' | 'bottom'
}

export interface EngineStats {
  fps: number
  frames: number
  controller: ControllerState
  /** Incremented every time the level is hot-swapped. */
  levelVersion: number
  levelWarnings: string[]
  /** Incremented every time the physics is hot-swapped. */
  physicsVersion: number
  jumpVelocity: number
  /** Non-null while the duck is out of play after leaving the level. */
  hurt: Hurt | null
  /** How many times the duck has left the level since the engine started. */
  ouches: number
}

export class Engine {
  readonly controller = new Controller()
  world: World
  physics: Physics
  /** While true the duck is simulated but not drawn (a slide overlay stands in for it). */
  hidePlayer = false
  private player: Player
  private hurt: Hurt | null = null
  private ouches = 0
  private ctx: CanvasRenderingContext2D | null = null
  private raf = 0
  private last = 0
  private acc = 0
  private running = false
  private frames = 0
  private levelVersion = 0
  private physicsVersion = 0
  private fpsCounter = { t: 0, n: 0, value: 0 }
  private lastState: ControllerState = {
    connected: false,
    moveX: 0,
    moveY: 0,
    jumpPressed: false,
    jumpHeld: false,
    actionPressed: false,
    source: 'none',
  }
  private onStats?: (s: EngineStats) => void

  constructor(world: World, physics: Physics) {
    this.world = world
    this.physics = physics
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

  /** The highest y at or below `y` that puts the player's feet on something solid. */
  private settle(x: number, y: number): number {
    const limit = this.world.rows * TILE
    while (y < limit && !this.collides(x, y + 1)) y++
    return y
  }

  private spawnPlayer(): Player {
    const { x, y } = this.world.spawn
    // A tall level can bury the fixed spawn point; lift it to the first free row.
    const safeY = this.collides(x, y) ? (this.findFreeYAbove(x, y) ?? 0) : y
    // Start standing. Gravity would do this on its own, if there is any.
    const floorY = this.settle(x, safeY)
    return { x, y: floorY, vx: 0, vy: 0, onGround: true, facing: 1 }
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

  /** Hot-swap the physics while the game is running. */
  setPhysics(physics: Physics) {
    this.physics = physics
    this.physicsVersion++
  }

  /** Read-only snapshot for diagnostics / tests. */
  get playerState() {
    return { ...this.player }
  }

  get hurtState() {
    return this.hurt ? { ...this.hurt } : null
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
    this.hurt = null
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
      this.step(this.lastState)
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
      physicsVersion: this.physicsVersion,
      jumpVelocity: this.physics.jumpVelocity,
      hurt: this.hurt ? { ...this.hurt } : null,
      ouches: this.ouches,
    })
  }

  // ---------------------------------------------------------------- physics

  /** One fixed step of simulation. Public so tests can drive it without a canvas. */
  step(input: ControllerState) {
    if (this.hurt) {
      if (--this.hurt.left <= 0) this.reset()
      return
    }

    const p = this.player

    p.vx = input.moveX * MOVE_SPEED
    if (input.moveX !== 0) p.facing = input.moveX > 0 ? 1 : -1

    if (input.jumpPressed && p.onGround) {
      p.vy = this.physics.jumpVelocity
      p.onGround = false
    }

    p.vy = this.physics.applyGravity(p.vy)

    // Horizontal move + resolve
    p.x += p.vx
    this.resolveX(p)

    // Vertical move + resolve
    p.y += p.vy
    this.resolveY(p)

    // Left the level? Out through the top happens when nothing pulls the duck
    // back down; out through the bottom cannot happen with the ground in place,
    // but a level is allowed to be wrong.
    if (p.y + PLAYER_H < 0) this.ouch('top')
    else if (p.y > this.world.rows * TILE + 200) this.ouch('bottom')
  }

  private ouch(where: Hurt['where']) {
    this.ouches++
    this.hurt = { left: HURT_STEPS, where }
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
    if (this.collides(p.x, p.y)) {
      if (p.vy > 0) {
        const r = Math.ceil((p.y + PLAYER_H) / TILE) - 1
        p.y = r * TILE - PLAYER_H
      } else if (p.vy < 0) {
        const r = Math.floor(p.y / TILE)
        p.y = (r + 1) * TILE
      }
      p.vy = 0
    }
    // "On the ground" means something solid is directly under the feet. Asking
    // this, rather than "did I just land", also works when there is no gravity
    // to keep pressing the duck into the floor.
    p.onGround = p.vy >= 0 && this.collides(p.x, p.y + 1)
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
    ctx.strokeStyle = COLORS.grid
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
          // Pyramid block: a '#' glyph on a crimson-tinted tile
          ctx.fillStyle = COLORS.blockFill
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2)
          ctx.strokeStyle = COLORS.blockStroke
          ctx.lineWidth = 1.5
          ctx.strokeRect(x + 1.5, y + 1.5, TILE - 3, TILE - 3)
          ctx.fillStyle = COLORS.blockGlyph
          ctx.fillText('#', x + TILE / 2, y + TILE / 2 + 1)
        }
      }
    }

    // Player: the CS50 duck, facing the way it last moved. Not while it is out
    // of play, and not while a slide overlay is standing in for it.
    if (this.hurt || this.hidePlayer) return
    const p = this.player
    drawDuck(ctx, p.x, p.y, p.facing, DUCK_SCALE)
  }
}
