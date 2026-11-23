/**
 * areas.ts — the two places in the game, each one screen: Harvard Yard and
 * the inside of the Science Center Gym. One character per 16 px tile; the
 * legend is each area's tileset (tiles.ts). Both are 20×14 tiles, so the
 * whole area fits the view and nothing scrolls.
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

export const COLS = 20
export const ROWS = 14

export const YARD: Area = {
  id: 'yard',
  tiles: YARD_TILES,
  rows: [
    'TTTTTT////////TTTTTT',
    'T.....cwwccwwc.....T',
    'T^^^^^cwwYcwwc^^^^^T',
    'T#o#o#cccddccc#oo#oT',
    'T##D##========IIIIIT',
    'T=============sssssT',
    'T..J.....==...L....T',
    'T.T......==......T.T',
    'Tgggg....==....ggggT',
    'TgggL....==....PgggT',
    'Tgggg....==....ggggT',
    'T.T.P....==......T.T',
    'T........==........T',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    { npc: 'student', col: 7, row: 5, facing: 'down' },
    { npc: 'brian', col: 4, row: 6, facing: 'left' },
    { npc: 'kelly', col: 12, row: 4, facing: 'down' },
    { npc: 'carter', col: 16, row: 5, facing: 'down' },
    { npc: 'colton', col: 13, row: 9, facing: 'left' },
  ],
  spawn: { col: 9, row: 12, facing: 'up' },
}

export const GYM: Area = {
  id: 'gym',
  tiles: GYM_TILES,
  rows: [
    'VVVVVVVVVVVVVVVVVVVV',
    'WWWWBBWWWWWWWWBBWWWW',
    'V       AAAA       V',
    'V                  V',
    'V  I            I  V',
    'V                  V',
    'V                  V',
    'V  I            I  V',
    'V                  V',
    'V                  V',
    'V  I            I  V',
    'V                  V',
    'V        MM        V',
    'VVVVVVVVVVVVVVVVVVVV',
  ],
  npcs: [
    { npc: 'leitner', col: 9, row: 2, facing: 'down' },
    { npc: 'malan', col: 6, row: 7, facing: 'down' },
  ],
  spawn: { col: 9, row: 11, facing: 'up' },
}

export const AREAS: Record<Area['id'], Area> = { yard: YARD, gym: GYM }

/** Where the duck lands when it leaves the Gym: just outside the doors. */
export const YARD_DOORSTEP = { col: 9, row: 4, facing: 'down' as const }
