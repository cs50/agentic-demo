/**
 * map.ts — Harvard Yard, one character per 16 px tile (legend in tiles.ts).
 *
 *   .  ,  grass        =  path        s  steps       ~  water
 *   #  o  brick, brick with window    ^  roof        D  wooden door
 *   c  w  concrete, with window       Y  GYM sign    d  the Gym door
 *   T tree   L lamppost   I column   J John Harvard's plinth
 *
 * North is up. The Science Center (concrete, the Gym) is at the top;
 * University Hall with the statue in front is on the left; Widener, with its
 * columns and steps, on the right. The duck starts on the path at the bottom.
 */

export const MAP_ROWS: string[] = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T..,..........^^^^^^^^^^^^^^..........,T',
  'T.............cwwcwwccwwcwwc..........,T',
  'T.............cccccccccccccc...........T',
  'T...T.........cwwcwwccwwcwwc.....T.....T',
  'T.............cccccccccccccc...........T',
  'T.............cwwcwwYYwwcwwc...........T',
  'T.............ccccccddcccccc...........T',
  'T.............==============..........,T',
  'T..T............L..====..L..........T..T',
  'T..................====................T',
  'T...,..............====........,.......T',
  'T..==================================..T',
  'T..==================================..T',
  'T.^^^^^^^^^^.......====......^^^^^^^^^^T',
  'T.#oo#oo#oo#.......====......#ooo##ooo#T',
  'T.##########.......====......##########T',
  'T.#oo#oo#oo#.......====......#ooo##ooo#T',
  'T.####DD####.......====......#IIIIIIII#T',
  'T.==========.......====......ssssssssssT',
  'T.====J=====.......====......==========T',
  'T...T..............====.........T......T',
  'T..................====................T',
  'T......L...........====..........L.....T',
  'T..................====................T',
  'T.T................====..............T.T',
  'T..................====................T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
]

export const MAP_COLS = MAP_ROWS[0].length
export const MAP_ROWS_N = MAP_ROWS.length

/** Where the duck starts, in tiles, and which way it faces. */
export const SPAWN = { col: 20, row: 24, facing: 'up' as const }

/** The visible window, in tiles. */
export const VIEW_COLS = 30
export const VIEW_ROWS = 20
