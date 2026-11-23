/**
 * battle.ts — the Gym battle as pure logic.
 *
 * The Gym Leader, Henry Leitner, has one monster, Sloppyclaude, whose moves are
 * all AI slop. Each round: the monster uses a move, a question is put to the room,
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
  /** The monster's move: something an AI says while being wrong. */
  move: string
  /** The lecture concepts this round reinforces. */
  concepts: string[]
  question: string
  options: string[]
  /** Index into options. */
  correct: number
  /** Shown after the answer, whichever way it went. */
  explanation: string
  /** The duck's counter-move when the room is right. */
  counter: string
}

/**
 * Fourteen rounds. Ten hits win, three misses lose, so a battle never runs
 * out of questions (10 + 2 = 12 ≤ 14); if it somehow did, the pool wraps.
 * Every concept from the lecture appears at least once. The correct option
 * moves around.
 */
export const ROUNDS: Round[] = [
  {
    id: 'gym-1',
    move: "You're absolutely right!",
    concepts: ['LLM'],
    question: "A language model's answer is best described as…",
    options: ['A lookup from a database of facts', 'The most likely next tokens, given the context', 'A verified answer', 'A search result'],
    correct: 1,
    explanation: 'It predicts text. Fluent is not the same as true; the checking is still your job.',
    counter: 'Read the Evidence',
  },
  {
    id: 'gym-2',
    move: 'Exactly!',
    concepts: ['Chatbot'],
    question: 'In the chatbot era, who runs the code, reads the error, and pastes it back?',
    options: ['The model', 'The browser', 'You', 'Nobody; it just works'],
    correct: 2,
    explanation: 'Text in, text out. Everything between the answers, running, reading, deciding, was you.',
    counter: 'Close the Loop',
  },
  {
    id: 'gym-3',
    move: 'Great question!',
    concepts: ['Tool calling'],
    question: 'An agent "uses a tool" when it…',
    options: ['Thinks harder', 'Opens a browser tab for you', 'Asks a second model', 'Emits a structured call that the harness runs, and reads the result'],
    correct: 3,
    explanation: 'The model asks; the harness acts; the result comes back as text. That loop is what makes it an agent.',
    counter: 'Tool Log',
  },
  {
    id: 'gym-4',
    move: 'I apologize for the confusion.',
    concepts: ['Harness'],
    question: 'The agent runs the tests, reads the failure, edits, runs again… forever. What stops it?',
    options: ['A step limit and permissions in the harness', 'A better prompt', 'Asking it nicely', 'A bigger model'],
    correct: 0,
    explanation: 'The harness, not the model, holds the limits: steps, permissions, what it may touch.',
    counter: 'Harness',
  },
  {
    id: 'gym-5',
    move: 'Let me fix that for you.',
    concepts: ['Specification'],
    question: 'Which of these can an agent actually be checked against?',
    options: ['"Make it work."', '"No bugs."', '"buy must reject a non-positive integer with an apology page."', '"Make no mistakes."'],
    correct: 2,
    explanation: 'A specification names an input and the required output. The other three are wishes.',
    counter: 'Acceptance Criteria',
  },
  {
    id: 'gym-6',
    move: "Here's the corrected version.",
    concepts: ['Guardrails'],
    question: 'A guardrail differs from an instruction in the prompt because…',
    options: ['It is written in capital letters', 'It is enforced outside the model, so it cannot be talked out of it', 'The model promises to follow it', 'It costs more tokens'],
    correct: 1,
    explanation: 'A prompt is a request. A guardrail is a check the model cannot argue with: a scanner, a permission, a test.',
    counter: 'Guardrail',
  },
  {
    id: 'gym-7',
    move: "I've thoroughly tested this.",
    concepts: ['Verification'],
    question: 'The agent says the feature is done. What do you look at?',
    options: ['The code it wrote', 'Its summary of what it did', 'How confident it sounds', 'The artifact: test output, a screenshot, the running page'],
    correct: 3,
    explanation: 'Verify the artifact, not the claim. Confidence is free; evidence is not.',
    counter: 'Verify First',
  },
  {
    id: 'gym-8',
    move: 'This should work now.',
    concepts: ['Verification'],
    question: 'The agent reports "all tests pass." The cheapest way to know:',
    options: ['Run the tests yourself and read the output', 'Trust it; it said so', 'Ask it again, more firmly', 'Check that the diff is long enough'],
    correct: 0,
    explanation: '"All tests pass" is a sentence. A green test run is a fact. Ask for the fact.',
    counter: 'Run It Yourself',
  },
  {
    id: 'gym-9',
    move: 'Certainly!',
    concepts: ['Multi-agent'],
    question: 'Why split a feature across several agents?',
    options: ['Models get bored', 'It is faster to type', "Each agent's context stays small, and its work can be checked on its own", 'The harness requires it'],
    correct: 2,
    explanation: 'One agent testing its own work has thirteen things in its head. Four agents with three each check each other.',
    counter: 'Small Context',
  },
  {
    id: 'gym-10',
    move: 'I see the issue now.',
    concepts: ['Multi-agent', 'Specification'],
    question: 'What does the handoff between two agents consist of?',
    options: ['Nothing; they share a memory', 'A written spec and the artifacts so far', 'A feeling', 'A longer prompt'],
    correct: 1,
    explanation: 'The next agent sees only what was written down. If the spec is not in the handoff, it does not exist.',
    counter: 'Handoff Spec',
  },
  {
    id: 'gym-11',
    move: 'Great catch!',
    concepts: ['Software factory'],
    question: 'In a software factory, where does the human belong?',
    options: ['Nowhere; that is the point', 'At the gates: the issue, the spec, the review before merge', 'Typing every line', 'Only when it crashes'],
    correct: 1,
    explanation: 'You decide what to build, what correct means, and what ships. The factory does the rest.',
    counter: 'Approval Gate',
  },
  {
    id: 'gym-12',
    move: "That's a fantastic point.",
    concepts: ['Approval gates'],
    question: 'An approval gate is…',
    options: ['A firewall', 'A unit test', 'A prompt that says "be careful"', 'A point where a person must say yes before the work continues'],
    correct: 3,
    explanation: 'Where the gate sits is the dial: everything waits, the sensible middle, or the dark factory.',
    counter: 'Hold the Gate',
  },
  {
    id: 'gym-13',
    move: 'Hope this helps!',
    concepts: ['Guardrails', 'Specification'],
    question: '"Make no mistakes" in a prompt is…',
    options: ['A wish; nothing checks it', 'A guardrail', 'A specification', 'A test'],
    correct: 0,
    explanation: 'It ranked sixth on the Prompt Index. Analysts describe it as a wish rather than an instruction.',
    counter: 'Write It Down',
  },
  {
    id: 'gym-14',
    move: 'As an AI language model…',
    concepts: ['LLM', 'Verification'],
    question: 'When a model says "I have verified this," what has it done?',
    options: ['Run the code', 'Checked the documentation', 'Produced the most likely next tokens', 'Asked a colleague'],
    correct: 2,
    explanation: 'Unless a tool ran and its output came back, "verified" is just a word it predicted.',
    counter: 'Read the Evidence',
  },
]

/** Ten hits to win, three misses to lose. */
export const MAX_HP = 100
export const HIT = 10
export const DUCK_HIT = 34

export type Phase =
  | 'intro' // "Gym Leader HENRY would like to battle!"
  | 'sendout' // the ball is thrown; Sloppyclaude appears
  | 'duckin' // "Go! CS50 DUCK!"; the duck hops in
  | 'move' // "Sloppyclaude used CONFIDENT NONSENSE!"
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
  /** How many times the pool has wrapped in this battle (0 in practice). */
  lap: number
}

/** The hub poll id for a round in a given attempt (see Battle.pollId). */
export function pollIdFor(s: Pick<BattleState, 'round' | 'attempt' | 'lap'>): string {
  if (!s.round) return ''
  // "gym-3" the first time; "gym-3#2" on the second attempt; "gym-3#2.2" if the pool wrapped too.
  let id = s.round.id
  if (s.attempt > 0 || s.lap > 0) id += `#${s.attempt + 1}`
  if (s.lap > 0) id += `.${s.lap + 1}`
  return id
}

export class Battle {
  private s: BattleState = Battle.fresh(0)

  private static fresh(attempt: number): BattleState {
    return { phase: 'intro', roundIndex: 0, round: null, monsterHp: MAX_HP, duckHp: MAX_HP, last: null, score: 0, attempt, lap: 0 }
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
        this.s = { ...this.s, phase: 'sendout' }
        return false
      case 'sendout':
        this.s = { ...this.s, phase: 'duckin' }
        return false
      case 'duckin':
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
        // Neither has fainted, so there is another round. The pool is sized so
        // this never runs out (ten hits plus two misses is twelve of fourteen);
        // if it did, start over at the top, under new poll ids.
        const next = this.s.roundIndex + 1
        const lap = next >= ROUNDS.length ? this.s.lap + 1 : this.s.lap
        const idx = next % ROUNDS.length
        this.s = { ...this.s, phase: 'move', roundIndex: idx, round: ROUNDS[idx], last: null, lap }
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
        return 'Gym Leader HENRY would like to battle!'
      case 'sendout':
        return 'Gym Leader HENRY sent out SLOPPYCLAUDE!'
      case 'duckin':
        return 'Go! CS50 DUCK!'
      case 'move':
        return `Sloppyclaude used "${round!.move}"`
      case 'question':
        return 'The room decides…'
      case 'resolve':
        return last!.correct
          ? `The room saw through it. "${round!.move}" had no effect! The duck used ${round!.counter.toUpperCase()}.`
          : `The room was not convinced. "${round!.move}" hits the duck.`
      case 'explain':
        return round!.explanation
      case 'won':
        return 'Sloppyclaude fainted. You earned the AI SLOP DEFENDER badge!'
      case 'lost':
        return 'The duck fainted. Gym Leader HENRY: "Let\'s go over that again. At the board."'
    }
  }
}
