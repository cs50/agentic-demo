/**
 * hub.ts — one lecture's audience session, as pure logic.
 *
 * The Hub knows who is connected, which poll is open, who voted for what, the
 * presenter's latest slide position and live-demo source, and the messages
 * the audience has sent. It does no I/O: every method returns the messages
 * that should go out and to whom, and server/index.ts delivers them. That
 * keeps the rules testable (tests/hub.test.ts) with no sockets involved.
 *
 * Rules worth knowing:
 *   - One vote per device (`clientId`), last one wins while the poll is open.
 *     A phone that reconnects keeps its vote.
 *   - Live tallies go to presenters only. When a poll closes, everyone gets
 *     the counts.
 *   - A `choice` poll closes itself when its time is up (the server calls
 *     `tick()`), and names a winner; ties go to the option that reached the
 *     winning count first.
 *   - Only an authenticated presenter may open or close polls, publish slide
 *     position (`sync`) or live source, or reset. A wrong token demotes the
 *     connection to the audience rather than dropping it.
 *   - A socket's identity is fixed at its first hello. A later hello may change
 *     the name or present a token; it cannot become another voter.
 *   - There is one session at a time. `reset` clears it for the next lecture,
 *     and so does a presenter arriving with a new `session` id (each `pnpm dev`
 *     run has its own), so a fresh start of the deck is a fresh room and phones
 *     are not left following the last rehearsal.
 *
 * Accepted residual risk: the audience is anonymous by design (no login), so
 * one device that opens several sockets with several ids is several voters.
 * The hub keeps one honest socket to one vote and rate-limits every socket
 * (server/index.ts); it does not try to tell two phones from one phone with
 * two tabs. A join nonce would close that gap at the cost of making every
 * client load /join first; not worth it for a lecture-hall show of hands.
 */

import {
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_OPTIONS,
  type AudienceMessage,
  type ClientMessage,
  type HelloMessage,
  type Poll,
  type PollResult,
  type Role,
  type ServerMessage,
  type StateMessage,
  type SyncState,
  type Tally,
} from './protocol.ts'

export type Target =
  | { kind: 'conn'; id: string }
  | { kind: 'role'; role: Role }
  | { kind: 'all' }

export interface Outbound {
  to: Target
  msg: ServerMessage
}

interface Connection {
  connId: string
  clientId: string
  role: Role
  name?: string
  /** For the per-connection message rate limit. */
  lastMessageAt: number
}

interface Vote {
  option: number
  at: number
}

export interface HubOptions {
  presenterToken: string
  /** Injected clock, for tests. */
  now?: () => number
  /** Most recent audience messages kept for a presenter who connects late. */
  messageHistory?: number
  /** Minimum gap between two messages from one connection, in ms. */
  messageIntervalMs?: number
}

/** A poll as sent by the presenter, before the server stamps it. */
type PollRequest = { id: string; kind: Poll['kind']; question: string; options: string[]; durationMs?: number }

const toConn = (id: string): Target => ({ kind: 'conn', id })
const toRole = (role: Role): Target => ({ kind: 'role', role })
const toAll: Target = { kind: 'all' }

export class Hub {
  private readonly token: string
  private readonly now: () => number
  private readonly messageHistory: number
  private readonly messageIntervalMs: number

  private connections = new Map<string, Connection>()
  private poll: Poll | null = null
  private votes = new Map<string, Vote>()
  /** Per option, when its count last went up; breaks ties in a `choice` poll. */
  private reachedAt: number[] = []
  private result: PollResult | null = null
  private messages: AudienceMessage[] = []
  private sync = new Map<string, SyncState>()
  private liveSource = new Map<string, string>()
  /** The presenter run the room belongs to; see HelloMessage.session. */
  private session: string | null = null

  constructor(opts: HubOptions) {
    this.token = opts.presenterToken
    this.now = opts.now ?? Date.now
    this.messageHistory = opts.messageHistory ?? 200
    this.messageIntervalMs = opts.messageIntervalMs ?? 1000
  }

  // ------------------------------------------------------------ connections

  /** A socket said hello. Registers it and returns its first messages. */
  connect(connId: string, hello: HelloMessage): Outbound[] {
    return this.register(connId, hello, undefined)
  }

  /**
   * `connect` and a re-sent `hello` meet here. On a re-hello the socket keeps
   * the identity it joined with (`clientId`) and its message clock: a second
   * hello may change a name or present a token, never mint a new voter.
   */
  private register(connId: string, hello: HelloMessage, previous: Connection | undefined): Outbound[] {
    const out: Outbound[] = []
    const clientId =
      previous?.clientId ?? (typeof hello.clientId === 'string' && hello.clientId ? hello.clientId.slice(0, 64) : connId)
    const name = cleanName(hello.name)

    let role: Role = 'audience'
    if (hello.role === 'presenter') {
      if (hello.token === this.token) role = 'presenter'
      else out.push({ to: toConn(connId), msg: { type: 'error', reason: 'presenter token rejected; joined as audience' } })
    }

    // A presenter from a new run of the deck starts a new lecture: whatever the
    // room still holds from the last one goes, and everyone else is told.
    const session = typeof hello.session === 'string' && hello.session ? hello.session.slice(0, 64) : null
    let fresh = false
    if (role === 'presenter' && session && session !== this.session) {
      this.session = session
      this.clear()
      fresh = true
    }

    const before = this.audienceCount()
    this.connections.set(connId, { connId, clientId, role, name, lastMessageAt: previous?.lastMessageAt ?? 0 })
    out.push({ to: toConn(connId), msg: this.snapshot(connId) })
    if (fresh) for (const id of this.connections.keys()) if (id !== connId) out.push({ to: toConn(id), msg: this.snapshot(id) })
    if (role === 'presenter' && previous?.role !== 'presenter') {
      // A presenter arriving late still gets the room's messages so far.
      for (const m of this.messages) out.push({ to: toConn(connId), msg: { type: 'message', ...m } })
    }
    out.push(...this.audienceCountChanged(before))
    return out
  }

  disconnect(connId: string): Outbound[] {
    if (!this.connections.has(connId)) return []
    const before = this.audienceCount()
    this.connections.delete(connId)
    return this.audienceCountChanged(before)
  }

  /** Distinct devices in the audience (one person on two tabs counts once). */
  audienceCount(): number {
    const ids = new Set<string>()
    for (const c of this.connections.values()) if (c.role === 'audience') ids.add(c.clientId)
    return ids.size
  }

  connectionCount(): number {
    return this.connections.size
  }

  roleOf(connId: string): Role | null {
    return this.connections.get(connId)?.role ?? null
  }

  /** When the open timed poll will close, or null. The server schedules `tick()` from this. */
  closesAt(): number | null {
    return this.poll?.open && this.poll.closesAt ? this.poll.closesAt : null
  }

  // -------------------------------------------------------------- messages

  handle(connId: string, msg: ClientMessage): Outbound[] {
    const conn = this.connections.get(connId)
    if (!conn) return [{ to: toConn(connId), msg: { type: 'error', reason: 'say hello first' } }]
    if (!msg || typeof msg !== 'object' || typeof (msg as { type?: unknown }).type !== 'string') {
      return [{ to: toConn(connId), msg: { type: 'error', reason: 'malformed message' } }]
    }

    switch (msg.type) {
      case 'hello':
        // A client that re-sends hello (a name change, a token presented late)
        // keeps the identity and clock it joined with; see register().
        return this.register(connId, msg, conn)
      case 'vote':
        return this.vote(conn, msg.pollId, msg.option)
      case 'message':
        return this.message(conn, msg.text)
      case 'poll:open':
        return this.presenterOnly(conn, () => this.openPoll(msg.poll))
      case 'poll:close':
        return this.presenterOnly(conn, () => this.closePoll(msg.pollId))
      case 'sync':
        return this.presenterOnly(conn, () => this.publishSync(conn, msg.channel, msg.state))
      case 'live-source':
        return this.presenterOnly(conn, () => this.publishLiveSource(conn, msg.file, msg.content))
      case 'reset':
        return this.presenterOnly(conn, () => this.reset())
      default:
        return [{ to: toConn(connId), msg: { type: 'error', reason: `unknown message type ${(msg as { type: string }).type}` } }]
    }
  }

  /** Close a timed poll whose time has come. Safe to call any time. */
  tick(): Outbound[] {
    const closesAt = this.closesAt()
    if (closesAt === null || this.now() < closesAt) return []
    return this.closePoll(this.poll!.id)
  }

  // ------------------------------------------------------------ snapshots

  snapshot(connId: string): StateMessage {
    const conn = this.connections.get(connId)
    const role = conn?.role ?? 'audience'
    const vote = conn ? this.votes.get(conn.clientId)?.option ?? null : null
    const showTally = this.poll !== null && (role === 'presenter' || !this.poll.open)
    return {
      type: 'state',
      now: this.now(),
      you: { clientId: conn?.clientId ?? connId, role, name: conn?.name },
      poll: this.poll,
      tally: showTally ? this.tally() : null,
      result: this.result,
      vote,
      audienceCount: this.audienceCount(),
      sync: Object.fromEntries(this.sync),
      liveSource: Object.fromEntries(this.liveSource),
    }
  }

  tally(): Tally | null {
    if (!this.poll) return null
    const counts = this.poll.options.map(() => 0)
    for (const v of this.votes.values()) if (v.option < counts.length) counts[v.option]++
    return { pollId: this.poll.id, counts, total: this.votes.size }
  }

  // ---------------------------------------------------------------- voting

  private vote(conn: Connection, pollId: unknown, option: unknown): Outbound[] {
    const poll = this.poll
    if (!poll || !poll.open || poll.id !== pollId) {
      return [{ to: toConn(conn.connId), msg: { type: 'error', reason: 'that poll is not open' } }]
    }
    if (typeof option !== 'number' || !Number.isInteger(option) || option < 0 || option >= poll.options.length) {
      return [{ to: toConn(conn.connId), msg: { type: 'error', reason: 'no such option' } }]
    }
    const previous = this.votes.get(conn.clientId)
    if (previous?.option === option) {
      return [{ to: toConn(conn.connId), msg: { type: 'vote:ack', pollId: poll.id, option } }]
    }
    const at = this.now()
    this.votes.set(conn.clientId, { option, at })
    this.reachedAt[option] = at
    const tally = this.tally()!
    return [
      { to: toConn(conn.connId), msg: { type: 'vote:ack', pollId: poll.id, option } },
      { to: toRole('presenter'), msg: { type: 'tally', ...tally } },
    ]
  }

  private message(conn: Connection, text: unknown): Outbound[] {
    if (typeof text !== 'string') return [{ to: toConn(conn.connId), msg: { type: 'error', reason: 'message must be text' } }]
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!trimmed) return []
    const at = this.now()
    if (at - conn.lastMessageAt < this.messageIntervalMs) {
      return [{ to: toConn(conn.connId), msg: { type: 'error', reason: 'one message per second, please' } }]
    }
    conn.lastMessageAt = at
    const m: AudienceMessage = { from: conn.name || 'anonymous', text: trimmed, at }
    this.messages.push(m)
    if (this.messages.length > this.messageHistory) this.messages.splice(0, this.messages.length - this.messageHistory)
    return [{ to: toRole('presenter'), msg: { type: 'message', ...m } }]
  }

  // ----------------------------------------------------------- presenting

  private presenterOnly(conn: Connection, fn: () => Outbound[]): Outbound[] {
    if (conn.role !== 'presenter') return [{ to: toConn(conn.connId), msg: { type: 'error', reason: 'presenter only' } }]
    return fn()
  }

  private openPoll(req: unknown): Outbound[] {
    const poll = validatePoll(req)
    if (typeof poll === 'string') return [{ to: toRole('presenter'), msg: { type: 'error', reason: poll } }]
    // Both presenter tabs (slide and presenter view) open the same poll: once is enough.
    if (this.poll?.id === poll.id && this.poll.open) return []
    const openedAt = this.now()
    this.poll = {
      ...poll,
      openedAt,
      closesAt: poll.durationMs ? openedAt + poll.durationMs : undefined,
      open: true,
    }
    this.votes.clear()
    this.reachedAt = poll.options.map(() => 0)
    this.result = null
    return [{ to: toAll, msg: { type: 'poll:open', poll: this.poll } }]
  }

  private closePoll(pollId: unknown): Outbound[] {
    const poll = this.poll
    if (!poll || poll.id !== pollId) return []
    if (!poll.open) return []
    poll.open = false
    poll.closesAt = this.now()
    const tally = this.tally()!
    const out: Outbound[] = [{ to: toAll, msg: { type: 'poll:close', ...tally } }]
    if (poll.kind === 'choice') {
      this.result = { ...tally, winner: this.winner(tally.counts) }
      out.push({ to: toAll, msg: { type: 'poll:result', ...this.result } })
    }
    return out
  }

  /** Highest count wins; among equals, the option that got there first. */
  private winner(counts: number[]): number {
    let best = 0
    for (let i = 1; i < counts.length; i++) {
      if (counts[i] > counts[best]) best = i
      else if (counts[i] === counts[best] && this.reachedAt[i] < this.reachedAt[best]) best = i
    }
    return best
  }

  private publishSync(conn: Connection, channel: unknown, state: unknown): Outbound[] {
    if (typeof channel !== 'string' || !channel || !state || typeof state !== 'object') {
      return [{ to: toConn(conn.connId), msg: { type: 'error', reason: 'sync needs a channel and a state object' } }]
    }
    this.sync.set(channel, state as SyncState)
    return [{ to: toRole('audience'), msg: { type: 'sync', channel, state: state as SyncState } }]
  }

  private publishLiveSource(conn: Connection, file: unknown, content: unknown): Outbound[] {
    if (typeof file !== 'string' || !file || typeof content !== 'string') {
      return [{ to: toConn(conn.connId), msg: { type: 'error', reason: 'live-source needs a file and string content' } }]
    }
    this.liveSource.set(file, content)
    return [{ to: toRole('audience'), msg: { type: 'live-source', file, content } }]
  }

  private reset(): Outbound[] {
    this.clear()
    // Everyone re-renders from a fresh snapshot.
    return [...this.connections.keys()].map((id) => ({ to: toConn(id), msg: this.snapshot(id) }))
  }

  /** Forget the lecture so far; connections and the session id stay. */
  private clear() {
    this.poll = null
    this.votes.clear()
    this.reachedAt = []
    this.result = null
    this.messages = []
    this.sync.clear()
    this.liveSource.clear()
  }

  // ---------------------------------------------------------------- helpers

  private audienceCountChanged(before: number): Outbound[] {
    const count = this.audienceCount()
    if (count === before) return []
    return [{ to: toRole('presenter'), msg: { type: 'audience', count } }]
  }
}

function cleanName(name: unknown): string | undefined {
  if (typeof name !== 'string') return undefined
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH)
  return trimmed || undefined
}

/** Returns the poll, or a reason it was refused. */
function validatePoll(req: unknown): PollRequest | string {
  if (!req || typeof req !== 'object') return 'poll must be an object'
  const p = req as Record<string, unknown>
  if (typeof p.id !== 'string' || !p.id) return 'poll needs an id'
  if (p.kind !== 'poll' && p.kind !== 'choice') return 'poll kind must be "poll" or "choice"'
  if (typeof p.question !== 'string') return 'poll needs a question'
  if (!Array.isArray(p.options) || p.options.length < 2 || p.options.length > MAX_OPTIONS) {
    return `poll needs 2 to ${MAX_OPTIONS} options`
  }
  if (!p.options.every((o) => typeof o === 'string' && o.trim())) return 'every option must be non-empty text'
  if (p.durationMs !== undefined && (typeof p.durationMs !== 'number' || !(p.durationMs > 0))) {
    return 'durationMs must be a positive number'
  }
  return {
    id: p.id.slice(0, 64),
    kind: p.kind,
    question: p.question,
    options: p.options as string[],
    durationMs: p.durationMs as number | undefined,
  }
}

/** Does `target` include this connection? Used by the server to deliver an Outbound. */
export function targets(target: Target, connId: string, role: Role): boolean {
  switch (target.kind) {
    case 'all':
      return true
    case 'conn':
      return target.id === connId
    case 'role':
      return target.role === role
  }
}
