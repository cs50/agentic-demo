/**
 * render.ts — draws the Yard and the battle onto a canvas. Text that must be
 * read from the back row (dialogue, questions, HP numbers) is HTML in the
 * component; this file draws pixels only.
 */

import type { OverworldState } from './overworld'
import { MAP_ROWS, VIEW_COLS, VIEW_ROWS } from './map'
import { NPCS } from './npcs'
import { CURSOR_OFF, SLOPWHALE } from './slopwhale'
import { DUCK_BACK, PERSON, PERSON_BACK, STATUE, drawSprite, duckWalk } from './sprites'
import { STATUE_TILE, TILE, TILES } from './tiles'

export const VIEW_W = VIEW_COLS * TILE // 480
export const VIEW_H = VIEW_ROWS * TILE // 320

// ---------------------------------------------------------------- overworld

/** Tiles are drawn once into an offscreen canvas per character, then blitted. */
const tileCache = new Map<string, HTMLCanvasElement>()

function tileImage(ch: string): HTMLCanvasElement | null {
  const cached = tileCache.get(ch)
  if (cached) return cached
  const def = TILES[ch]
  if (!def) return null
  const c = document.createElement('canvas')
  c.width = TILE
  c.height = TILE
  drawSprite(c.getContext('2d')!, def.sprite, 0, 0, 1)
  tileCache.set(ch, c)
  return c
}

export function drawOverworld(ctx: CanvasRenderingContext2D, s: OverworldState) {
  const { camera } = s
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#9ccc65'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  const c0 = Math.floor(camera.x / TILE)
  const r0 = Math.floor(camera.y / TILE)
  for (let r = r0; r <= r0 + VIEW_ROWS; r++) {
    const row = MAP_ROWS[r]
    if (!row) continue
    for (let c = c0; c <= c0 + VIEW_COLS; c++) {
      const ch = row[c]
      if (!ch) continue
      const img = tileImage(ch)
      if (img) ctx.drawImage(img, c * TILE - camera.x, r * TILE - camera.y)
    }
  }

  // Things that stand on tiles, drawn in row order so lower ones overlap upper ones.
  type Thing = { y: number; draw: () => void }
  const things: Thing[] = []

  MAP_ROWS.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== STATUE_TILE) continue
      const x = c * TILE - camera.x
      const y = r * TILE - camera.y
      things.push({ y: r * TILE, draw: () => drawSprite(ctx, STATUE, x, y - 8, 1) })
    }
  })

  for (const n of NPCS) {
    const x = n.col * TILE - camera.x + 2
    const y = n.row * TILE - camera.y
    // People face the duck when it is directly below them; otherwise the camera.
    const sprite = PERSON
    things.push({ y: n.row * TILE, draw: () => drawSprite(ctx, sprite, x, y, 1, false, { S: n.shirt, H: n.hair }) })
  }

  const { sprite, flipX } = duckWalk(s.facing, s.moving ? s.frame : 0)
  things.push({ y: s.y, draw: () => drawSprite(ctx, sprite, s.x - camera.x + 1, s.y - camera.y + 1, 1, flipX) })

  things.sort((a, b) => a.y - b.y)
  for (const t of things) t.draw()
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
}

const MONSTER_SCALE = 3
const DUCK_SCALE = 4

export function drawBattle(ctx: CanvasRenderingContext2D, scene: BattleScene) {
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  // Floor: everything below the monster's platform
  ctx.fillStyle = '#f1f3f5'
  ctx.fillRect(0, 150, VIEW_W, VIEW_H - 150)
  ctx.fillStyle = '#dee2e6'
  ctx.fillRect(0, 150, VIEW_W, 2)

  // Platforms: monster top right, duck bottom left (above the text box)
  ctx.fillStyle = '#e9ecef'
  ellipse(ctx, 350, 118, 88, 16)
  ellipse(ctx, 110, 196, 72, 14)

  // Monster, top right. Breathes every 40 frames; the cursor blinks every 30.
  if (!scene.monsterGone) {
    const breathe = Math.floor(scene.clock / 40) % 2 === 1
    const sprite = scene.monsterHurt > 0 ? SLOPWHALE.hurt : breathe ? SLOPWHALE.idleB : SLOPWHALE.idleA
    const blink = Math.floor(scene.clock / 30) % 2 === 1
    const shake = scene.monsterHurt > 0 ? (scene.monsterHurt % 4 < 2 ? 3 : -3) : 0
    const x = 350 - (28 * MONSTER_SCALE) / 2 + shake
    const y = 118 - 22 * MONSTER_SCALE + 6
    drawSprite(ctx, sprite, x, y, MONSTER_SCALE, false, blink ? CURSOR_OFF : undefined)
  }

  // Duck, bottom left, from behind.
  if (!scene.duckGone) {
    const shake = scene.duckHurt > 0 ? (scene.duckHurt % 4 < 2 ? 3 : -3) : 0
    const x = 110 - (14 * DUCK_SCALE) / 2 + shake
    const y = 196 - 14 * DUCK_SCALE + 6
    drawSprite(ctx, DUCK_BACK, x, y, DUCK_SCALE)
  }
}

function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}

/** Where the Gym Leader stands when introduced: behind the monster. */
export function drawLeader(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drawSprite(ctx, PERSON_BACK, x, y, 3, false, { S: '#212529', H: '#212529' })
}
