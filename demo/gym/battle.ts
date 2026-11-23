/**
 * battle.ts — the Gym battle as pure logic.
 *
 * The Gym Leader (the Agent) has one monster, Slopwhale, whose moves are all
 * AI slop. Each round: the monster uses a move, a question is put to the room,
 * the room answers (a hub `choice` poll on stage; the controller when there is
 * no hub), and the answer decides who takes the hit. Five rounds cover the ten
 * concepts in pairs.
 *
 * Nothing here knows about the hub or the canvas: the component feeds
 * `pollClosed(winner, total)` and `advance()`, and renders `state`. That keeps
 * the rules testable (tests/battle.test.ts).
 */

export interface Round {
  /** Also the hub poll id (unique in the deck). */
  id: string
  /** The monster's move. */
  move: string
  /** The two lecture concepts this round reinforces. */
  concepts: [string, string]
  question: string
  options: string[]
  /** Index into options. */
  correct: number
  /** Shown after the answer, whichever way it went. */
  explanation: string
  /** The duck's counter-move when the room is right. */
  counter: string
}

export const ROUNDS: Round[] = [
  {
    id: 'gym-1',
    move: 'Confident Nonsense',
    concepts: ['LLM', 'Chatbot'],
    question: "A language model's answer is best described as…",
    options: [
      'A lookup from a database of facts',
      'The most likely next tokens, given the context',
      'A verified answer',
      'A search result',
    ],
    correct: 1,
    explanation: 'It predicts text. Fluent is not the same as true; the checking is still your job.',
    counter: 'Read the Evidence',
  },
  {
    id: 'gym-2',
    move: 'Infinite Loop',
    concepts: ['Tool calling', 'Harness'],
    question: 'The agent runs the tests, reads the failure, edits, runs again… forever. What stops it?',
    options: ['A better prompt', 'A step limit and permissions in the harness', 'Asking it nicely', 'A bigger model'],
    correct: 1,
    explanation: 'The harness, not the model, holds the limits: steps, permissions, what it may touch.',
    counter: 'Harness',
  },
  {
    id: 'gym-3',
    move: 'Vibe Spec',
    concepts: ['Specification', 'Guardrails'],
    question: 'Which of these can an agent actually be checked against?',
    options: ['"Make it work."', '"buy must reject a non-positive integer with an apology page."', '"No bugs."', '"Make no mistakes."'],
    correct: 1,
    explanation: 'A specification names an input and the required output. The other three are wishes.',
    counter: 'Acceptance Criteria',
  },
  {
    id: 'gym-4',
    move: 'Works On My Machine',
    concepts: ['Verification', 'Multi-agent'],
    question: 'The agent says the feature is done. What do you look at?',
    options: ['The code it wrote', 'Its summary of what it did', 'The artifact: test output, a screenshot, the running page', 'How confident it sounds'],
    correct: 2,
    explanation: 'Verify the artifact, not the claim. Confidence is free; evidence is not.',
    counter: 'Verify First',
  },
  {
    id: 'gym-5',
    move: "You're Absolutely Right",
    concepts: ['Software factory', 'Approval gates'],
    question: 'In a software factory, where does the human belong?',
    options: ['Nowhere; that is the point', 'Typing every line', 'At the gates: the issue, the spec, the review before merge', 'Only when it crashes'],
    correct: 2,
    explanation: 'You decide what to build, what correct means, and what ships. The factory does the rest.',
    counter: 'Approval Gate',
  },
]

export const MAX_HP = 100
/** A correct answer hits the monster this hard; a wrong one hits the duck. */
export const HIT = 25
export const DUCK_HIT = 34

export type Phase =
  | 'intro' // "Gym Leader AGENT would like to battle!"
  | 'move' // "Slopwhale used CONFIDENT NONSENSE!"
  | 'question' // the poll is open
  | 'resolve' // the room answered; damage shown
  | 'explain' // the one-liner
  | 'won'
  | 'lost'

export interface BattleState {
  phase: Phase
  roundIndex: number
  round: Round | null
  monsterHp: number
  duckHp: number
  /** Set in `resolve`/`explain`: how the last round went. */
  last: { correct: boolean; winner: number; total: number } | null
  /** Rounds answered correctly so far. */
  score: number
  /** How many times the battle has been started (poll ids get this as a suffix on a rematch). */
  attempt: number
}

/** The hub poll id for a round in a given attempt (see Battle.pollId). */
export function pollIdFor(s: Pick<BattleState, 'round' | 'attempt'>): string {
  if (!s.round) return ''
  return s.attempt === 0 ? s.round.id : `${s.round.id}#${s.attempt + 1}`
}

export class Battle {
  private s: BattleState = Battle.fresh(0)

  private static fresh(attempt: number): BattleState {
    return { phase: 'intro', roundIndex: 0, round: null, monsterHp: MAX_HP, duckHp: MAX_HP, last: null, score: 0, attempt }
  }

  get state(): Readonly<BattleState> {
    return this.s
  }

  /** The hub poll id for the current round; unique per attempt so a rematch is not deduped. */
  pollId(): string {
    return pollIdFor(this.s)
  }

  /** Begin, or begin again. */
  start() {
    const attempt = this.s.phase === 'won' || this.s.phase === 'lost' ? this.s.attempt + 1 : this.s.attempt
    this.s = Battle.fresh(attempt)
  }

  /**
   * ✕ on the controller (or the room's deck pressing on). Moves text along;
   * during the question it does nothing, since the poll decides. Returns true
   * when a question has just been opened, so the component can open the poll.
   */
  advance(): boolean {
    switch (this.s.phase) {
      case 'intro':
        this.s = { ...this.s, phase: 'move', round: ROUNDS[0], roundIndex: 0 }
        return false
      case 'move':
        this.s = { ...this.s, phase: 'question' }
        return true
      case 'question':
        return false
      case 'resolve':
        this.s = { ...this.s, phase: 'explain' }
        return false
      case 'explain': {
        if (this.s.monsterHp <= 0) {
          this.s = { ...this.s, phase: 'won' }
          return false
        }
        if (this.s.duckHp <= 0) {
          this.s = { ...this.s, phase: 'lost' }
          return false
        }
        const next = this.s.roundIndex + 1
        if (next >= ROUNDS.length) {
          // Out of moves: whoever has more HP left takes it; the room usually does.
          this.s = { ...this.s, phase: this.s.monsterHp <= this.s.duckHp ? 'won' : 'lost' }
          return false
        }
        this.s = { ...this.s, phase: 'move', roundIndex: next, round: ROUNDS[next], last: null }
        return false
      }
      case 'won':
      case 'lost':
        return false
    }
  }

  /**
   * The room has answered: `winner` is the option index the hub named (or the
   * presenter picked). Ignored outside the question phase.
   */
  pollClosed(winner: number, total: number) {
    if (this.s.phase !== 'question' || !this.s.round) return
    const correct = winner === this.s.round.correct
    this.s = {
      ...this.s,
      phase: 'resolve',
      last: { correct, winner, total },
      monsterHp: correct ? Math.max(0, this.s.monsterHp - HIT) : this.s.monsterHp,
      duckHp: correct ? this.s.duckHp : Math.max(0, this.s.duckHp - DUCK_HIT),
      score: this.s.score + (correct ? 1 : 0),
    }
  }

  /** The dialogue line for the current phase. */
  line(): string {
    const { phase, round, last } = this.s
    switch (phase) {
      case 'intro':
        return 'Gym Leader AGENT would like to battle!'
      case 'move':
        return `Slopwhale used ${round!.move.toUpperCase()}!`
      case 'question':
        return 'The room decides…'
      case 'resolve':
        return last!.correct
          ? `The room answered correctly. The duck used ${round!.counter.toUpperCase()}! It's super effective.`
          : `The room was not convinced. ${round!.move.toUpperCase()} hits the duck.`
      case 'explain':
        return round!.explanation
      case 'won':
        return 'Slopwhale fainted. You earned the VERIFICATION BADGE.'
      case 'lost':
        return 'The duck fainted. Gym Leader AGENT: "Come back after Week 11."'
    }
  }
}
