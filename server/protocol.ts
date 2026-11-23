/**
 * protocol.ts — the JSON messages exchanged over the hub's websocket.
 *
 * Imported by both sides: the server (server/hub.ts) and the deck
 * (composables/useHub.ts), so a renamed field breaks loudly in both places.
 * The audience page (server/public/join.html) is plain JavaScript and mirrors
 * these shapes by hand; keep it in step.
 *
 * Roles:
 *   presenter  the lecturer's deck (local `pnpm dev`, or the hosted deck with a
 *              token). Opens and closes polls, publishes slide position and the
 *              live demo's source. Authenticated by PRESENTER_TOKEN.
 *   audience   everyone else: phones on /join, or the hosted deck following
 *              along. Votes and sends messages. No authentication.
 */

export type Role = 'presenter' | 'audience'

/** `poll` shows a question; `choice` is a timed vote whose winner drives the game. */
export type PollKind = 'poll' | 'choice'

export interface Poll {
  id: string
  kind: PollKind
  question: string
  options: string[]
  /** Set for `choice` polls: the server closes the poll itself when this elapses. */
  durationMs?: number
  /** Server clock (ms since epoch) when the poll opened and, if timed, will close. */
  openedAt: number
  closesAt?: number
  open: boolean
}

export interface Tally {
  pollId: string
  /** One count per option, same order as `poll.options`. */
  counts: number[]
  total: number
}

export interface PollResult extends Tally {
  /** Index into `options`. Ties go to the option that reached the winning count first. */
  winner: number
}

export interface AudienceMessage {
  from: string
  text: string
  at: number
}

/** Slidev's per-channel shared state (navigation, drawings), opaque to the hub. */
export type SyncState = Record<string, unknown>

// ------------------------------------------------------------ client → server

export interface HelloMessage {
  type: 'hello'
  role: Role
  /** Stable per device (localStorage), so a reconnect keeps its vote. */
  clientId: string
  name?: string
  /** Presenters only. */
  token?: string
  /**
   * Presenters only: an id for this run of the presenter's deck (`pnpm dev`
   * mints one per start). A presenter whose id differs from the room's current
   * one begins a new lecture, and the hub clears the previous session first.
   * Reconnects and second windows of the same run carry the same id and clear
   * nothing. Absent on the hosted deck, which never resets by connecting.
   */
  session?: string
}

export interface VoteMessage {
  type: 'vote'
  pollId: string
  /** Index into `options`. */
  option: number
}

export interface TextMessage {
  type: 'message'
  text: string
}

export interface PollOpenMessage {
  type: 'poll:open'
  poll: Pick<Poll, 'id' | 'kind' | 'question' | 'options' | 'durationMs'>
}

export interface PollCloseMessage {
  type: 'poll:close'
  pollId: string
}

export interface SyncMessage {
  type: 'sync'
  channel: string
  state: SyncState
}

export interface LiveSourceMessage {
  type: 'live-source'
  file: string
  content: string
}

export interface ResetMessage {
  type: 'reset'
}

export type ClientMessage =
  | HelloMessage
  | VoteMessage
  | TextMessage
  | PollOpenMessage
  | PollCloseMessage
  | SyncMessage
  | LiveSourceMessage
  | ResetMessage

// ------------------------------------------------------------ server → client

/** Everything a client needs to render, sent once after `hello` and after `reset`. */
export interface StateMessage {
  type: 'state'
  /** Server clock (ms since epoch), so phones can show a timed poll's countdown against the server's deadline. */
  now: number
  you: { clientId: string; role: Role; name?: string }
  poll: Poll | null
  /** Present for presenters while a poll is open, and for everyone once it has closed. */
  tally: Tally | null
  result: PollResult | null
  /** This client's vote on the current poll, if any. */
  vote: number | null
  audienceCount: number
  sync: Record<string, SyncState>
  liveSource: Record<string, string>
}

export interface AudienceCountMessage {
  type: 'audience'
  count: number
}

export interface TallyMessage extends Tally {
  type: 'tally'
}

export interface PollOpenedMessage {
  type: 'poll:open'
  poll: Poll
}

export interface PollClosedMessage extends Tally {
  type: 'poll:close'
}

export interface PollResultMessage extends PollResult {
  type: 'poll:result'
}

export interface VoteAckMessage {
  type: 'vote:ack'
  pollId: string
  option: number
}

export interface MessageRelay extends AudienceMessage {
  type: 'message'
}

export interface SyncRelay extends Omit<SyncMessage, 'type'> {
  type: 'sync'
}

export interface LiveSourceRelay extends Omit<LiveSourceMessage, 'type'> {
  type: 'live-source'
}

export interface ErrorMessage {
  type: 'error'
  reason: string
}

export type ServerMessage =
  | StateMessage
  | AudienceCountMessage
  | TallyMessage
  | PollOpenedMessage
  | PollClosedMessage
  | PollResultMessage
  | VoteAckMessage
  | MessageRelay
  | SyncRelay
  | LiveSourceRelay
  | ErrorMessage

// ----------------------------------------------------------------- limits

/** Longest free-text message accepted from the audience. */
export const MAX_MESSAGE_LENGTH = 500
/** Longest display name accepted. */
export const MAX_NAME_LENGTH = 40
/** Most options a poll may have (the audience page lays them out as buttons). */
export const MAX_OPTIONS = 8
/** The default websocket path; the static deck and /join share the origin. */
export const WS_PATH = '/ws'
