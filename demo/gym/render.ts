/**
 * render.ts — draws the Yard, the Gym and the battle onto a canvas. Text that
 * must be read from the back row (dialogue, questions, HP) is HTML in the
 * component; this file draws pixels only.
 */

import { AREAS, COLS, ROWS } from './areas'
import { NPCS } from './npcs'
import type { OverworldState } from './overworld'
import { CURSOR_OFF, SLOPWHALE } from './slopwhale'
import { DUCK_BACK, STATUE, drawSprite, duckWalk, personSprite, type Sprite } from './sprites'
import { STATUE_TILE, TILE, type TileDef } from './tiles'

export const VIEW_W = COLS * TILE // 320
export const VIEW_H = ROWS * TILE // 224

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
  /** The Gym Leader stands behind the monster during the introduction. */
  showLeader: boolean
}

const MONSTER_SCALE = 2
const DUCK_SCALE = 3
const LEADER_SCALE = 2

export function drawBattle(ctx: CanvasRenderingContext2D, scene: BattleScene) {
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#f8f8f0'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  // Floor: everything below the monster's platform
  ctx.fillStyle = '#e8ecd8'
  ctx.fillRect(0, 104, VIEW_W, VIEW_H - 104)
  ctx.fillStyle = '#c0c8b0'
  ctx.fillRect(0, 104, VIEW_W, 2)

  // Platforms: monster top right, duck bottom left
  ctx.fillStyle = '#d8dcc8'
  ellipse(ctx, 236, 86, 56, 10)
  ellipse(ctx, 76, 138, 44, 8)

  if (scene.showLeader) {
    const { sprite } = personSprite(NPCS.leitner.look, 'down', 0)
    drawSprite(ctx, sprite, 236 + 40, 86 - 16 * LEADER_SCALE - 14, LEADER_SCALE)
  }

  if (!scene.monsterGone) {
    const breathe = Math.floor(scene.clock / 40) % 2 === 1
    const sprite = scene.monsterHurt > 0 ? SLOPWHALE.hurt : breathe ? SLOPWHALE.idleB : SLOPWHALE.idleA
    const blink = Math.floor(scene.clock / 30) % 2 === 1
    const shake = scene.monsterHurt > 0 ? (scene.monsterHurt % 4 < 2 ? 2 : -2) : 0
    const x = 236 - (28 * MONSTER_SCALE) / 2 + shake
    const y = 86 - 22 * MONSTER_SCALE + 4
    drawSprite(ctx, sprite, x, y, MONSTER_SCALE, false, blink ? CURSOR_OFF : undefined)
  }

  if (!scene.duckGone) {
    const shake = scene.duckHurt > 0 ? (scene.duckHurt % 4 < 2 ? 2 : -2) : 0
    const x = 76 - (16 * DUCK_SCALE) / 2 + shake
    const y = 138 - 16 * DUCK_SCALE + 4
    drawSprite(ctx, DUCK_BACK, x, y, DUCK_SCALE)
  }
}

function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}
