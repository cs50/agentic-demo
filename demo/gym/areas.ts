/**
 * areas.ts — the two places in the game, each one screen: Harvard Yard and
 * the inside of the Science Center Gym. One character per 16 px tile; the
 * legend is each area's tileset (tiles.ts). Both are 32×18 tiles (16:9), so
 * the whole area fills the slide and nothing scrolls.
 *
 * Yard:   . , ground   g grass   = path   T tree   L lamppost   P signpost
 *         ^ / roofs    # o brick, with window   c w concrete, with window
 *         Y GYM sign   D wooden door   d the Gym door   I column   s steps
 *         J John Harvard's plinth
 * Gym:    (space) floor   V W walls   B blackboard   A the leader's dais
 *         I pillar   M the mat by the door (step on it to leave)
 */

import { GYM_TILES, YARD_TILES, type TileDef } from './tiles'
import type { Facing } from './sprites'

export interface Placement {
  npc: string
  col: number
  row: number
  facing?: Facing
}

export interface Area {
  id: 'yard' | 'gym'
  rows: string[]
  tiles: Record<string, TileDef>
  npcs: Placement[]
  /** Where the duck appears on entering this area, and which way it faces. */
  spawn: { col: number; row: number; facing: Facing }
}

export const COLS = 32
export const ROWS = 18

export const YARD: Area = {
  id: 'yard',
  tiles: YARD_TILES,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T.........////////////.........T',
    'T..,..T...cwwccwwccwwc...T.,...T',
    'T^^^^^^^^.cccccccccccc.^^^^^^^^T',
    'T#o#oo#o#.cwwccYwccwwc.#oo##oo#T',
    'T########.cccccddccccc.#IIIIII#T',
    'T###D###L==============LsssssssT',
    'T========......==......========T',
    'T.==J=========================.T',
    'T.============================.T',
    'T..T.........P.==...........T..T',
    'T.gggggg.......==.......gggggg.T',
    'T.ggLggg.......==.......gggLgg.T',
    'T.gggggg.......==.......gggggg.T',
    'T.gggggg.......==.......gggggg.T',
    'T......P.T.....==.....T.P......T',
    'T..T...........==...........T..T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    { npc: 'student', col: 12, row: 8, facing: 'down' },
    { npc: 'brian', col: 5, row: 8, facing: 'left' },
    { npc: 'kelly', col: 18, row: 6, facing: 'down' },
    { npc: 'carter', col: 26, row: 7, facing: 'down' },
    { npc: 'colton', col: 23, row: 12, facing: 'left' },
  ],
  spawn: { col: 15, row: 16, facing: 'up' },
}

export const GYM: Area = {
  id: 'gym',
  tiles: GYM_TILES,
  rows: [
    'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VWWWWWBBWWWWWWBBBBWWWWWWBBWWWWWV',
    'V             AAAA             V',
    'V                              V',
    'V                              V',
    'V   I                      I   V',
    'V                              V',
    'V                              V',
    'V                              V',
    'V   I                      I   V',
    'V                              V',
    'V                              V',
    'V                              V',
    'V   I                      I   V',
    'V                              V',
    'V                              V',
    'V              MM              V',
    'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  ],
  npcs: [
    { npc: 'leitner', col: 15, row: 2, facing: 'down' },
    { npc: 'malan', col: 10, row: 9, facing: 'down' },
  ],
  spawn: { col: 15, row: 15, facing: 'up' },
}

export const AREAS: Record<Area['id'], Area> = { yard: YARD, gym: GYM }

/** Where the duck lands when it leaves the Gym: just outside the doors. */
export const YARD_DOORSTEP = { col: 15, row: 6, facing: 'down' as const }

/** Where the duck stands after a battle: in front of the Gym Leader. */
export const BEFORE_LEADER = { col: 15, row: 3, facing: 'up' as const }
