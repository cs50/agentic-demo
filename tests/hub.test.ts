/**
 * The hub's rules, exercised without sockets: who may do what, one vote per
 * device, what each role sees, timed polls, and what a late joiner receives.
 */
import { describe, expect, it } from 'vitest'
import { Hub, targets, type Outbound } from '../server/hub'
import type { HelloMessage, ServerMessage, StateMessage } from '../server/protocol'

const TOKEN = 'secret'

function makeHub(now: { t: number } = { t: 1000 }) {
  const hub = new Hub({ presenterToken: TOKEN, now: () => now.t, messageIntervalMs: 1000 })
  return { hub, now }
}

const presenterHello = (clientId = 'p1'): HelloMessage => ({ type: 'hello', role: 'presenter', clientId, token: TOKEN })
const audienceHello = (clientId: string, name?: string): HelloMessage => ({ type: 'hello', role: 'audience', clientId, name })

const ofType = <T extends ServerMessage['type']>(out: Outbound[], type: T) =>
  out.filter((o) => o.msg.type === type) as (Outbound & { msg: Extract<ServerMessage, { type: T }> })[]

const stateFor = (out: Outbound[], connId: string) =>
  ofType(out, 'state').find((o) => o.to.kind === 'conn' && o.to.id === connId)?.msg as StateMessage

const poll = { id: 'q1', kind: 'poll' as const, question: 'Which language?', options: ['C', 'Python', 'English'] }

describe('joining', () => {
  it('a presenter with the right token is a presenter', () => {
    const { hub } = makeHub()
    const out = hub.connect('c1', presenterHello())
    expect(hub.roleOf('c1')).toBe('presenter')
    expect(stateFor(out, 'c1').you.role).toBe('presenter')
    expect(ofType(out, 'error')).toHaveLength(0)
  })

  it('a wrong token joins as audience and is told so', () => {
    const { hub } = makeHub()
    const out = hub.connect('c1', { ...presenterHello(), token: 'nope' })
    expect(hub.roleOf('c1')).toBe('audience')
    expect(ofType(out, 'error')[0].msg.reason).toMatch(/token/)
  })

  it('counts devices, not tabs, and tells presenters', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    const a = hub.connect('a1', audienceHello('phone-1'))
    expect(ofType(a, 'audience')[0].msg).toEqual({ type: 'audience', count: 1 })
    const b = hub.connect('a2', audienceHello('phone-1')) // same phone, second tab
    expect(ofType(b, 'audience')).toHaveLength(0)
    expect(hub.audienceCount()).toBe(1)
    hub.connect('a3', audienceHello('phone-2'))
    expect(hub.audienceCount()).toBe(2)
    const gone = hub.disconnect('a3')
    expect(ofType(gone, 'audience')[0].msg.count).toBe(1)
  })

  it('trims names and treats an empty one as absent', () => {
    const { hub } = makeHub()
    expect(stateFor(hub.connect('a', audienceHello('x', '  Ada  ')), 'a').you.name).toBe('Ada')
    expect(stateFor(hub.connect('b', audienceHello('y', '   ')), 'b').you.name).toBeUndefined()
  })

  it('refuses messages from a socket that never said hello', () => {
    const { hub } = makeHub()
    const out = hub.handle('ghost', { type: 'vote', pollId: 'q1', option: 0 })
    expect(ofType(out, 'error')[0].msg.reason).toMatch(/hello/)
  })
})

describe('polls', () => {
  it('only a presenter may open one', () => {
    const { hub } = makeHub()
    hub.connect('a', audienceHello('x'))
    const out = hub.handle('a', { type: 'poll:open', poll })
    expect(ofType(out, 'error')[0].msg.reason).toBe('presenter only')
    expect(ofType(out, 'poll:open')).toHaveLength(0)
  })

  it('opening goes to everyone and is idempotent for the same id', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('x'))
    const first = hub.handle('p', { type: 'poll:open', poll })
    expect(ofType(first, 'poll:open')[0].to).toEqual({ kind: 'all' })
    expect(ofType(first, 'poll:open')[0].msg.poll.open).toBe(true)
    // The presenter view opens it too.
    expect(hub.handle('p', { type: 'poll:open', poll })).toEqual([])
  })

  it('rejects a malformed poll', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    const bad = hub.handle('p', { type: 'poll:open', poll: { ...poll, options: ['only one'] } })
    expect(ofType(bad, 'error')[0].msg.reason).toMatch(/2 to/)
  })

  it('one vote per device, last one wins, tallies go to presenters only', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.connect('a1', audienceHello('phone-1'))
    hub.connect('a2', audienceHello('phone-1')) // same phone, following the deck in another tab
    hub.connect('b', audienceHello('phone-2'))
    hub.handle('p', { type: 'poll:open', poll })

    let out = hub.handle('a1', { type: 'vote', pollId: 'q1', option: 0 })
    expect(ofType(out, 'vote:ack')[0].msg.option).toBe(0)
    expect(ofType(out, 'tally')[0].to).toEqual({ kind: 'role', role: 'presenter' })
    expect(ofType(out, 'tally')[0].msg.counts).toEqual([1, 0, 0])

    out = hub.handle('a2', { type: 'vote', pollId: 'q1', option: 2 }) // changed their mind, other tab
    expect(ofType(out, 'tally')[0].msg.counts).toEqual([0, 0, 1])

    hub.handle('b', { type: 'vote', pollId: 'q1', option: 2 })
    expect(hub.tally()).toEqual({ pollId: 'q1', counts: [0, 0, 2], total: 2 })
  })

  it('rejects votes for a closed poll or an option that does not exist', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('x'))
    hub.handle('p', { type: 'poll:open', poll })
    expect(ofType(hub.handle('a', { type: 'vote', pollId: 'q1', option: 7 }), 'error')[0].msg.reason).toMatch(/option/)
    expect(ofType(hub.handle('a', { type: 'vote', pollId: 'q1', option: 1.5 }), 'error')).toHaveLength(1)
    hub.handle('p', { type: 'poll:close', pollId: 'q1' })
    expect(ofType(hub.handle('a', { type: 'vote', pollId: 'q1', option: 0 }), 'error')[0].msg.reason).toMatch(/not open/)
  })

  it('closing sends the counts to everyone, once', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('x'))
    hub.handle('p', { type: 'poll:open', poll })
    hub.handle('a', { type: 'vote', pollId: 'q1', option: 1 })
    const out = hub.handle('p', { type: 'poll:close', pollId: 'q1' })
    expect(ofType(out, 'poll:close')[0]).toMatchObject({ to: { kind: 'all' }, msg: { counts: [0, 1, 0], total: 1 } })
    expect(ofType(out, 'poll:result')).toHaveLength(0) // not a choice
    expect(hub.handle('p', { type: 'poll:close', pollId: 'q1' })).toEqual([])
  })

  it('hides the live tally from the audience until the poll closes', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('x'))
    hub.handle('p', { type: 'poll:open', poll })
    hub.handle('a', { type: 'vote', pollId: 'q1', option: 0 })
    expect(hub.snapshot('a').tally).toBeNull()
    expect(hub.snapshot('a').vote).toBe(0)
    expect(hub.snapshot('p').tally?.counts).toEqual([1, 0, 0])
    hub.handle('p', { type: 'poll:close', pollId: 'q1' })
    expect(hub.snapshot('a').tally?.counts).toEqual([1, 0, 0])
  })

  it('opening a new poll replaces the old one and clears votes', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('x'))
    hub.handle('p', { type: 'poll:open', poll })
    hub.handle('a', { type: 'vote', pollId: 'q1', option: 0 })
    hub.handle('p', { type: 'poll:open', poll: { ...poll, id: 'q2', options: ['yes', 'no'] } })
    expect(hub.tally()).toEqual({ pollId: 'q2', counts: [0, 0], total: 0 })
    expect(hub.snapshot('a').vote).toBeNull()
  })
})

describe('choice polls', () => {
  const choice = { id: 'g1', kind: 'choice' as const, question: 'Where next?', options: ['left', 'right', 'up'], durationMs: 10_000 }

  it('close themselves when time is up and name a winner', () => {
    const { hub, now } = makeHub({ t: 1000 })
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('a'))
    hub.connect('b', audienceHello('b'))
    const opened = ofType(hub.handle('p', { type: 'poll:open', poll: choice }), 'poll:open')[0].msg.poll
    expect(opened.closesAt).toBe(11_000)
    expect(hub.closesAt()).toBe(11_000)

    hub.handle('a', { type: 'vote', pollId: 'g1', option: 1 })
    hub.handle('b', { type: 'vote', pollId: 'g1', option: 1 })
    expect(hub.tick()).toEqual([]) // not yet

    now.t = 11_000
    const out = hub.tick()
    expect(ofType(out, 'poll:close')).toHaveLength(1)
    expect(ofType(out, 'poll:result')[0].msg).toMatchObject({ winner: 1, counts: [0, 2, 0], total: 2 })
    expect(hub.closesAt()).toBeNull()
    expect(hub.snapshot('a').result?.winner).toBe(1)
  })

  it('break ties in favour of the option that got there first', () => {
    const { hub, now } = makeHub({ t: 1000 })
    hub.connect('p', presenterHello())
    for (const id of ['a', 'b', 'c', 'd']) hub.connect(id, audienceHello(id))
    hub.handle('p', { type: 'poll:open', poll: choice })
    now.t = 1001
    hub.handle('a', { type: 'vote', pollId: 'g1', option: 2 })
    now.t = 1002
    hub.handle('b', { type: 'vote', pollId: 'g1', option: 0 })
    now.t = 1003
    hub.handle('c', { type: 'vote', pollId: 'g1', option: 0 }) // option 0 reaches 2 first
    now.t = 1004
    hub.handle('d', { type: 'vote', pollId: 'g1', option: 2 }) // option 2 reaches 2 later
    const out = hub.handle('p', { type: 'poll:close', pollId: 'g1' })
    expect(ofType(out, 'poll:result')[0].msg.winner).toBe(0)
  })

  it('with no votes, the first option wins', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.handle('p', { type: 'poll:open', poll: choice })
    const out = hub.handle('p', { type: 'poll:close', pollId: 'g1' })
    expect(ofType(out, 'poll:result')[0].msg.winner).toBe(0)
  })
})

describe('messages', () => {
  it('go to presenters, named or anonymous, and are rate limited', () => {
    const { hub, now } = makeHub({ t: 5000 })
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('x', 'Ada'))
    hub.connect('b', audienceHello('y'))
    const out = hub.handle('a', { type: 'message', text: '  hello  ' })
    expect(ofType(out, 'message')[0]).toMatchObject({ to: { kind: 'role', role: 'presenter' }, msg: { from: 'Ada', text: 'hello', at: 5000 } })
    expect(ofType(hub.handle('b', { type: 'message', text: 'hi' }), 'message')[0].msg.from).toBe('anonymous')
    expect(ofType(hub.handle('a', { type: 'message', text: 'again' }), 'error')[0].msg.reason).toMatch(/per second/)
    now.t = 6000
    expect(ofType(hub.handle('a', { type: 'message', text: 'again' }), 'message')).toHaveLength(1)
    expect(hub.handle('a', { type: 'message', text: '   ' })).toEqual([])
  })

  it('are replayed to a presenter who connects late', () => {
    const { hub } = makeHub()
    hub.connect('a', audienceHello('x', 'Ada'))
    hub.handle('a', { type: 'message', text: 'first' })
    const out = hub.connect('p', presenterHello())
    expect(ofType(out, 'message').map((o) => o.msg.text)).toEqual(['first'])
  })
})

describe('slide sync and live source', () => {
  it('are presenter-only, fan out to the audience, and are replayed on hello', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('x'))
    expect(ofType(hub.handle('a', { type: 'sync', channel: 'nav', state: { page: 3 } }), 'error')).toHaveLength(1)

    const out = hub.handle('p', { type: 'sync', channel: 'nav', state: { page: 12, clicks: 2 } })
    expect(ofType(out, 'sync')[0]).toMatchObject({ to: { kind: 'role', role: 'audience' }, msg: { channel: 'nav', state: { page: 12, clicks: 2 } } })

    hub.handle('p', { type: 'live-source', file: 'demo/mario/level.ts', content: 'export function buildLevel() {}' })
    const late = stateFor(hub.connect('b', audienceHello('late')), 'b')
    expect(late.sync).toEqual({ nav: { page: 12, clicks: 2 } })
    expect(late.liveSource).toEqual({ 'demo/mario/level.ts': 'export function buildLevel() {}' })
  })
})

describe('reset', () => {
  it('clears the session and re-snapshots everyone', () => {
    const { hub } = makeHub()
    hub.connect('p', presenterHello())
    hub.connect('a', audienceHello('x'))
    hub.handle('p', { type: 'poll:open', poll })
    hub.handle('a', { type: 'vote', pollId: 'q1', option: 0 })
    hub.handle('a', { type: 'message', text: 'hello' })
    hub.handle('p', { type: 'sync', channel: 'nav', state: { page: 4 } })
    const out = hub.handle('p', { type: 'reset' })
    expect(ofType(out, 'state')).toHaveLength(2)
    const a = stateFor(out, 'a')
    expect(a.poll).toBeNull()
    expect(a.sync).toEqual({})
    expect(hub.audienceCount()).toBe(1) // connections survive
    // Messages were cleared too: a new presenter gets none.
    expect(ofType(hub.connect('p2', presenterHello('p2')), 'message')).toHaveLength(0)
  })
})

describe('targets', () => {
  it('match the way the server delivers', () => {
    expect(targets({ kind: 'all' }, 'x', 'audience')).toBe(true)
    expect(targets({ kind: 'conn', id: 'x' }, 'x', 'audience')).toBe(true)
    expect(targets({ kind: 'conn', id: 'x' }, 'y', 'audience')).toBe(false)
    expect(targets({ kind: 'role', role: 'presenter' }, 'x', 'audience')).toBe(false)
    expect(targets({ kind: 'all-except', id: 'x' }, 'x', 'presenter')).toBe(false)
  })
})
