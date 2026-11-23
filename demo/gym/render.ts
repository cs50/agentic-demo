/**
 * render.ts — draws the Yard, the Gym and the battle onto a canvas. Text that
 * must be read from the back row (dialogue, questions, HP) is HTML in the
 * component; this file draws pixels only.
 */

import { AREAS, COLS, ROWS } from './areas'
import { NPCS } from './npcs'
import type { OverworldState } from './overworld'
import { SLOPPYCLAUDE, SLOPPYCLAUDE_H, SLOPPYCLAUDE_W } from './sloppyclaude'
import { BALL, DUCK_SIDE, DUCK_SIDE_BLINK, DUCK_SIDE_HURT, STATUE, drawSprite, duckWalk, personSprite, type Sprite } from './sprites'
import { STATUE_TILE, TILE, type TileDef } from './tiles'

export const VIEW_W = COLS * TILE // 512
export const VIEW_H = ROWS * TILE // 288

// ---------------------------------------------------------------- overworld

/** Tiles are drawn once into an offscreen canvas each, then blitted. */
const tileCache = new Map<Sprite, HTMLCanvasElement>()

function tileImage(def: TileDef): HTMLCanvasElement {
  const cached = tileCache.get(def.sprite)
  if (cached) return cached
  const c = document.createElement('canvas')
  c.width = TILE
  c.height = TILE
  drawSprite(c.getContext('2d')!, def.sprite, 0, 0, 1)
  tileCache.set(def.sprite, c)
  return c
}

export function drawOverworld(ctx: CanvasRenderingContext2D, s: OverworldState) {
  const area = AREAS[s.area]
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#e8ecd8'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  area.rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const def = area.tiles[row[c]]
      if (def) ctx.drawImage(tileImage(def), c * TILE, r * TILE)
    }
  })

  // Things that stand on tiles, in row order so lower ones overlap upper ones.
  type Thing = { y: number; draw: () => void }
  const things: Thing[] = []

  if (s.area === 'yard') {
    area.rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== STATUE_TILE) continue
        things.push({ y: r * TILE, draw: () => drawSprite(ctx, STATUE, c * TILE, r * TILE - 8, 1) })
      }
    })
  }

  for (const a of s.actors) {
    const npc = NPCS[a.id]
    const { sprite, flipX } = personSprite(npc.look, a.facing, a.moving ? a.frame : 0)
    // People are drawn a little above their tile so their feet sit on it.
    things.push({ y: a.y, draw: () => drawSprite(ctx, sprite, a.x, a.y - 4, 1, flipX) })
  }

  const duck = duckWalk(s.facing)
  const bob = s.moving && s.frame ? -1 : 0
  things.push({ y: s.y, draw: () => drawSprite(ctx, duck.sprite, s.x, s.y - 2 + bob, 1, duck.flipX) })

  things.sort((a, b) => a.y - b.y)
  for (const t of things) t.draw()

  // Fade in after a door.
  if (s.sinceEnter < 20) {
    ctx.fillStyle = `rgba(24, 32, 40, ${1 - s.sinceEnter / 20})`
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
}

// --------------------------------------------------------------- transition

/** How long the flash-and-wipe into a battle lasts, in frames. */
export const TRANSITION_FRAMES = 84

/**
 * Drawn over the overworld when a battle starts: three flashes, then black
 * bars sweep in from alternate sides, then black. `t` counts frames.
 */
export function drawTransition(ctx: CanvasRenderingContext2D, t: number) {
  if (t < 36) {
    // Flash: six frames on, six off.
    if (Math.floor(t / 6) % 2 === 0) {
      ctx.fillStyle = 'rgba(248, 248, 240, 0.85)'
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    }
    return
  }
  const bars = 9
  const h = VIEW_H / bars
  const u = Math.min(1, (t - 36) / 34)
  const ease = u * u * (3 - 2 * u)
  ctx.fillStyle = '#182028'
  for (let i = 0; i < bars; i++) {
    const w = VIEW_W * ease
    const x = i % 2 === 0 ? 0 : VIEW_W - w
    ctx.fillRect(x, i * h, w, h + 1)
  }
}

/** Fade to black, `u` 0..1, drawn over whatever is on screen. */
export function drawFade(ctx: CanvasRenderingContext2D, u: number) {
  ctx.fillStyle = `rgba(24, 32, 40, ${Math.min(1, Math.max(0, u))})`
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
}

// ------------------------------------------------------------------- battle

export interface BattleScene {
  /** Frames since the battle screen appeared, for idle animation. */
  clock: number
  /** Frames left of the monster's hurt pose, 0 if none. */
  monsterHurt: number
  /** Frames left of the duck's hurt shake, 0 if none. */
  duckHurt: number
  monsterGone: boolean
  duckGone: boolean
  /** 0..1: the field slides in from the sides when the screen opens. */
  slideIn: number
  /** The Gym Leader: 0 standing where the monster will be, 0..1 walking off to the right, 1 gone. */
  leader: number
  /** The ball's flight, 0..1; -1 when there is no ball. */
  ball: number
  /** Frames left of the burst when the ball opens. */
  burst: number
  /** The monster's size, 0 hidden .. 1 full. */
  monster: number
  /** The duck's hop in, 0..1; -1 before it has been called. */
  duckIn: number
  /** Frames left of the duck's little victory hop after a round goes the room's way. */
  duckCheer: number
}

export function freshScene(): BattleScene {
  return { clock: 0, monsterHurt: 0, duckHurt: 0, monsterGone: false, duckGone: false, slideIn: 0, leader: 0, ball: -1, burst: 0, monster: 0, duckIn: -1, duckCheer: 0 }
}

const MONSTER_SCALE = 4
const DUCK_SCALE = 4
const LEADER_SCALE = 3
const MONSTER_AT = { x: 380, y: 112 } // platform centre
const DUCK_AT = { x: 124, y: 182 }
const FLOOR_Y = 136

export function drawBattle(ctx: CanvasRenderingContext2D, scene: BattleScene) {
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#f8f8f0'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  ctx.fillStyle = '#e8ecd8'
  ctx.fillRect(0, FLOOR_Y, VIEW_W, VIEW_H - FLOOR_Y)
  ctx.fillStyle = '#c0c8b0'
  ctx.fillRect(0, FLOOR_Y, VIEW_W, 2)

  // The two sides slide in as the screen opens.
  const slide = (1 - scene.slideIn) * VIEW_W
  const rightX = MONSTER_AT.x + slide
  const leftX = DUCK_AT.x - slide

  ctx.fillStyle = '#d8dcc8'
  ellipse(ctx, rightX, MONSTER_AT.y, 76, 13)
  ellipse(ctx, leftX, DUCK_AT.y, 58, 10)

  // The Gym Leader, then walking off to the right.
  if (scene.leader < 1) {
    const { sprite } = personSprite(NPCS.leitner.look, scene.leader > 0 ? 'right' : 'down', scene.leader > 0 && Math.floor(scene.clock / 6) % 2 ? 1 : 0)
    const x = rightX - (16 * LEADER_SCALE) / 2 + scene.leader * 170
    const y = MONSTER_AT.y - 16 * LEADER_SCALE + 8
    drawSprite(ctx, sprite, x, y, LEADER_SCALE, false)
  }

  // The ball, in a parabola from the leader's hand to the platform.
  if (scene.ball >= 0 && scene.ball < 1) {
    // From the leader's hand (he is a little way into his walk) down onto the platform.
    const u = scene.ball
    const x0 = rightX + 90
    const y0 = MONSTER_AT.y - 30
    const x = x0 + (rightX - x0) * u
    const y = y0 + (MONSTER_AT.y - 10 - y0) * u - 46 * Math.sin(Math.PI * u)
    drawSprite(ctx, BALL, Math.round(x) - 10, Math.round(y) - 10, 2)
  }

  // The burst when it opens.
  if (scene.burst > 0) {
    const r = (12 - scene.burst) * 8 + 10
    ctx.fillStyle = `rgba(248, 248, 240, ${scene.burst / 12})`
    ellipse(ctx, rightX, MONSTER_AT.y - 28, r, r * 0.8)
    ctx.strokeStyle = '#f8f8f0'
    ctx.lineWidth = 2
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(rightX + Math.cos(a) * r * 0.6, MONSTER_AT.y - 28 + Math.sin(a) * r * 0.5)
      ctx.lineTo(rightX + Math.cos(a) * r, MONSTER_AT.y - 28 + Math.sin(a) * r * 0.8)
      ctx.stroke()
    }
  }

  if (!scene.monsterGone && scene.monster > 0) {
    // Bounces now and then, as the reference's "pure joy" frame.
    const bounce = scene.clock % 150 < 14 && scene.clock % 150 >= 6
    const sprite = scene.monsterHurt > 0 ? SLOPPYCLAUDE.hurt : bounce ? SLOPPYCLAUDE.idleB : SLOPPYCLAUDE.idleA
    const shake = scene.monsterHurt > 0 ? (scene.monsterHurt % 4 < 2 ? 2 : -2) : 0
    // Grows out of the ball: an integer scale so the pixels stay crisp.
    const sc = Math.max(1, Math.round(MONSTER_SCALE * scene.monster))
    const x = rightX - (SLOPPYCLAUDE_W * sc) / 2 + shake
    const y = MONSTER_AT.y - SLOPPYCLAUDE_H * sc + 6
    drawSprite(ctx, sprite, x, y, sc)
  }

  if (!scene.duckGone && scene.duckIn >= 0) {
    const u = Math.min(1, scene.duckIn)
    // Two hops in from the left.
    let hop = u < 1 ? Math.abs(Math.sin(u * Math.PI * 2)) * 28 : 0
    // Idle: a slow breath (one pixel), and a hop of joy when a round goes the room's way.
    if (u === 1 && scene.duckHurt === 0) {
      hop += Math.floor(scene.clock / 32) % 2 === 1 ? 1 : 0
      if (scene.duckCheer > 0) hop += Math.abs(Math.sin((scene.duckCheer / 36) * Math.PI * 2)) * 18
    }
    const shake = scene.duckHurt > 0 ? (scene.duckHurt % 4 < 2 ? 2 : -2) : 0
    const x = leftX - 180 * (1 - u) - (16 * DUCK_SCALE) / 2 + shake
    const y = DUCK_AT.y - 16 * DUCK_SCALE + 6 - hop
    // Side profile, facing the monster, so the eye and beak read. The face
    // changes when hit, and it blinks every few seconds otherwise.
    const blink = scene.clock % 190 < 7
    const sprite = scene.duckHurt > 0 ? DUCK_SIDE_HURT : blink ? DUCK_SIDE_BLINK : DUCK_SIDE
    drawSprite(ctx, sprite, Math.round(x), Math.round(y), DUCK_SCALE)
  }
}

function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}
