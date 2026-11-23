/**
 * npcs.ts — the people in the Yard and what they say.
 *
 * Edit this file to change the dialogue; nothing else needs to know. Each
 * line is one text box; Cross advances. Lines are placeholders until the
 * lecture's script is written.
 */

export interface Npc {
  id: string
  name: string
  col: number
  row: number
  /** Shirt and hair colours, so they can be told apart. */
  shirt: string
  hair: string
  lines: string[]
}

export const NPCS: Npc[] = [
  {
    id: 'student',
    name: 'Student',
    col: 14,
    row: 12,
    shirt: '#a51c30',
    hair: '#4a3f1d',
    lines: [
      'I asked the agent to "fix it" and it fixed something.',
      'Not the thing I meant. Something.',
    ],
  },
  {
    id: 'tourist',
    name: 'Tourist',
    col: 8,
    row: 20,
    shirt: '#0072b2',
    hair: '#868e96',
    lines: [
      'The plaque says John Harvard, Founder, 1638.',
      'Wrong man, wrong role, wrong year. People still rub the shoe.',
      'Read the plaque yourself. Then check it.',
    ],
  },
  {
    id: 'professor',
    name: 'Professor',
    col: 24,
    row: 8,
    shirt: '#212529',
    hair: '#adb5bd',
    lines: [
      'The Gym Leader in there has one monster.',
      "It is very confident. It is also usually wrong. You'll do fine if you ask why.",
    ],
  },
  {
    id: 'guide',
    name: 'Tour Guide',
    col: 33,
    row: 20,
    shirt: '#e69f00',
    hair: '#4a3f1d',
    lines: [
      'Widener Library. Three and a half million books, none of them hallucinated.',
      'Well. Mostly.',
    ],
  },
]

/** What the statue says when you read its plaque. */
export const PLAQUE: string[] = [
  'JOHN HARVARD · FOUNDER · 1638',
  'Three claims in one line. Not the founder, not his likeness, and the college was founded in 1636.',
  'A confident statement is not a verified one.',
]

/** What the Gym door says before the battle begins. */
export const GYM_DOOR_LINES: string[] = ['SCIENCE CENTER GYM', 'Leader: AGENT. One monster. Press ✕ to challenge.']
