/**
 * npcs.ts — who is in the game and what they say. Edit freely.
 *
 * Looks are colours for the one person template in sprites.ts (hair, shirt,
 * glasses, tie…). Each line is one text box; ✕ advances. A `wander` NPC walks
 * about on its own and pauses now and then so the duck can catch it.
 */

import type { Look } from './sprites'

export interface Npc {
  id: string
  name: string
  look: Look
  lines: string[]
  /** Walks around at random, pausing for a few seconds between strolls. */
  wander?: boolean
  /** Talking to this NPC, once the lines are done, starts the Gym battle. */
  leader?: boolean
}

export const NPCS: Record<string, Npc> = {
  student: {
    id: 'student',
    name: 'Student',
    look: { hair: '#3a2a1a', shirt: '#a51c30' },
    lines: ['I asked the agent to "fix it" and it fixed something.', 'Not the thing I meant. Something.'],
  },
  brian: {
    id: 'brian',
    name: 'Brian',
    look: { hair: '#3a2a1a', shirt: '#4878c8' },
    lines: [
      'Founder, 1638, and not even his face. Three hallucinations on one plaque.',
      'So this predates language models. Somebody vibe-coded a statue in 1884 and nobody ran the tests.',
      'The output looked confident, so they shipped it. Sound familiar?',
    ],
  },
  kelly: {
    id: 'kelly',
    name: 'Kelly',
    look: { hair: '#201810', shirt: '#284060', longHair: true },
    lines: ['The Gym Leader in there has one monster.', "It is very confident. It is also usually wrong. You'll do fine if you ask why."],
  },
  carter: {
    id: 'carter',
    name: 'Carter',
    look: { hair: '#5a3a1a', shirt: '#e0a030' },
    lines: [
      'Widener. Three and a half million books on fifty-seven miles of shelves.',
      'Finding one by walking the stacks is a linear search. Ask the catalog instead: SELECT * FROM books WHERE title LIKE "%duck%";',
      'One row back, with a call number. That is what an index is for. Also: none of these books are hallucinated. Mostly.',
    ],
  },
  colton: {
    id: 'colton',
    name: 'Colton',
    look: { hair: '#8a5a2a', shirt: '#3a8a60' },
    lines: [
      'In 1865 an economist noticed something odd. Steam engines had gotten far more efficient, so each one burned less coal.',
      'And Britain burned more coal than ever. Cheaper steam meant more engines, more factories, more railways.',
      "That's Jevons Paradox: make a resource cheaper to use, and people use more of it, not less.",
      'Code just got cheap. So expect more software, not fewer programmers. Just different ones. Ones who know what to ask for.',
    ],
  },

  // ----------------------------------------------------------- the Gym
  malan: {
    id: 'malan',
    name: 'David',
    look: { hair: '#201810', shirt: '#202020', trousers: '#304058' },
    lines: ['Alllllllllllright… this is CS50…….'],
    wander: true,
  },
  leitner: {
    id: 'leitner',
    name: 'Gym Leader Henry',
    look: { hair: '#d8d8d0', shirt: '#f0f0f0', trousers: '#404858', glasses: true, tie: '#a51c30', receding: true },
    lines: [
      "Welcome. I'm Henry Leitner. I taught this course before some of your tools existed, and I'm teaching it again now that they do.",
      'I write on the blackboard because a claim you can see is a claim you can check. That is the whole lesson, really.',
      'My partner here is very confident. Let us find out whether the room is more careful than it is.',
      'Gym Leader HENRY would like to battle!',
    ],
    leader: true,
  },
}

/** What the statue says when you read its plaque. */
export const PLAQUE: string[] = [
  'JOHN HARVARD · FOUNDER · 1638',
  'Three claims in one line. Not the founder, not his likeness, and the college was founded in 1636.',
  'A confident statement is not a verified one.',
]

/** What the Gym's sign says before you go in. */
export const GYM_DOOR_LINES: string[] = ['SCIENCE CENTER GYM', 'Leader: Henry Leitner. One monster.']

/** What the Gym Leader says after the battle, by outcome. */
export const AFTER_WIN: string[] = [
  'Well fought. You did not take its word for it. You asked, you checked, and you were right to.',
  'That is the whole course in one sentence. Take the badge, and take the habit.',
]
export const AFTER_LOSS: string[] = ["Not yet. Let's go over that again, at the board. Come and talk to me when you're ready."]

/** What David says when he walks over at the very end. */
export const CLOSING: string[] = ['This was CS50…']
