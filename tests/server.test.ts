/**
 * The relay around the hub (server/app.ts), over real sockets on port 0: the
 * hello gate, tally coalescing, the timer that closes a timed vote, the rate
 * limit, and the static routes. tests/hub.test.ts proves the rules; this
 * proves the wiring the lecture depends on.
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
// `ws` is the server's dependency, installed under server/, not the deck's.
import WebSocket from '../server/node_modules/ws/index.js'
import { createHubServer, type HubServer } from '../server/app'
import { Hub } from '../server/hub'
import type { ServerMessage } from '../server/protocol'

const TOKEN = 'test-token'

let app: HubServer
let port: number
let root: string

beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), 'hub-test-'))
  mkdirSync(join(root, 'dist', 'assets'), { recursive: true })
  mkdirSync(join(root, 'dist-sibling'), { recursive: true })
  mkdirSync(join(root, 'public'))
  writeFileSync(join(root, 'dist', 'index.html'), '<!doctype html><title>deck</title>')
  writeFileSync(join(root, 'dist', 'assets', 'app-abc123.js'), 'console.log(1)')
  writeFileSync(join(root, 'dist-sibling', 'secret.txt'), 'nope')
  writeFileSync(join(root, 'public', 'join.html'), '<!doctype html><title>join</title>')
  app = createHubServer({
    hub: new Hub({ presenterToken: TOKEN }),
    distDir: join(root, 'dist'),
    publicDir: join(root, 'public'),
    tallyFlushMs: 50,
    pingMs: 60_000,
    ratePerSecond: 20,
    rateBurst: 10,
  })
  await new Promise<void>((r) => app.server.listen(0, r))
  port = (app.server.address() as { port: number }).port
})

afterEach(async () => {
  await app.close()
})

type Msg = ServerMessage & Record<string, any>

class Client {
  ws: WebSocket
  inbox: Msg[] = []
  waiters: ((m: Msg) => void)[] = []
  constructor() {
    this.ws = new WebSocket(`ws://127.0.0.1:${port}/ws`)
    this.ws.on('message', (d) => {
      const m = JSON.parse(d.toString())
      this.inbox.push(m)
      for (const w of [...this.waiters]) w(m)
    })
  }
  open(): Promise<void> {
    return new Promise((r) => this.ws.once('open', () => r()))
  }
  send(m: object) {
    this.ws.send(JSON.stringify(m))
  }
  /** Resolves with the first message (already received or future) matching `test`. */
  next(test: (m: Msg) => boolean, timeoutMs = 2000): Promise<Msg> {
    const found = this.inbox.find(test)
    if (found) return Promise.resolve(found)
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timed out waiting for ${test}`)), timeoutMs)
      const w = (m: Msg) => {
        if (!test(m)) return
        clearTimeout(t)
        this.waiters.splice(this.waiters.indexOf(w), 1)
        resolve(m)
      }
      this.waiters.push(w)
    })
  }
  closed(): Promise<number> {
    return new Promise((r) => this.ws.once('close', (code) => r(code)))
  }
  async join(hello: object): Promise<Msg> {
    await this.open()
    this.send(hello)
    return this.next((m) => m.type === 'state')
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const presenter = () => new Client().join({ type: 'hello', role: 'presenter', clientId: 'p', token: TOKEN })

describe('hello gate', () => {
  it('refuses anything before hello, and non-JSON', async () => {
    const c = new Client()
    await c.open()
    c.send({ type: 'vote', pollId: 'x', option: 0 })
    expect((await c.next((m) => m.type === 'error')).reason).toMatch(/hello first/)
    c.ws.send('not json')
    expect((await c.next((m) => m.type === 'error' && /JSON/.test(m.reason))).reason).toMatch(/JSON/)
    c.ws.close()
  })

  it('a wrong token joins as audience', async () => {
    const c = new Client()
    const state = await c.join({ type: 'hello', role: 'presenter', clientId: 'p', token: 'wrong' })
    expect(state.you.role).toBe('audience')
    c.ws.close()
  })
})

describe('polls over the wire', () => {
  it('coalesces a burst of votes into one tally for the presenter', async () => {
    const p = new Client()
    await p.join({ type: 'hello', role: 'presenter', clientId: 'p', token: TOKEN })
    const phones = await Promise.all(
      [0, 1, 2, 3, 4].map(async (i) => {
        const c = new Client()
        await c.join({ type: 'hello', role: 'audience', clientId: `phone-${i}` })
        return c
      }),
    )
    p.send({ type: 'poll:open', poll: { id: 'q', kind: 'poll', question: '?', options: ['a', 'b'] } })
    await Promise.all(phones.map((c) => c.next((m) => m.type === 'poll:open')))

    phones.forEach((c, i) => c.send({ type: 'vote', pollId: 'q', option: i % 2 }))
    await Promise.all(phones.map((c) => c.next((m) => m.type === 'vote:ack')))
    await sleep(150) // past one flush window, before a second could fire
    const tallies = p.inbox.filter((m) => m.type === 'tally')
    expect(tallies).toHaveLength(1)
    expect(tallies[0]).toMatchObject({ counts: [3, 2], total: 5 })
    // Phones saw no tally while the poll was open.
    for (const c of phones) expect(c.inbox.some((m) => m.type === 'tally')).toBe(false)

    p.send({ type: 'poll:close', pollId: 'q' })
    const closes = await Promise.all(phones.map((c) => c.next((m) => m.type === 'poll:close')))
    for (const m of closes) expect(m).toMatchObject({ counts: [3, 2], total: 5 })
    for (const c of [p, ...phones]) c.ws.close()
  })

  it('closes a timed choice by itself and names the winner', async () => {
    const p = new Client()
    await p.join({ type: 'hello', role: 'presenter', clientId: 'p', token: TOKEN })
    const a = new Client()
    await a.join({ type: 'hello', role: 'audience', clientId: 'a' })
    const b = new Client()
    await b.join({ type: 'hello', role: 'audience', clientId: 'b' })

    const t0 = Date.now()
    p.send({ type: 'poll:open', poll: { id: 'g', kind: 'choice', question: '?', options: ['left', 'right'], durationMs: 120 } })
    await a.next((m) => m.type === 'poll:open')
    a.send({ type: 'vote', pollId: 'g', option: 1 })
    b.send({ type: 'vote', pollId: 'g', option: 1 })

    const result = await b.next((m) => m.type === 'poll:result')
    expect(Date.now() - t0).toBeGreaterThanOrEqual(100)
    expect(result).toMatchObject({ pollId: 'g', winner: 1, counts: [0, 2], total: 2 })
    // The close preceded the result, for everyone, without the presenter asking.
    expect(a.inbox.map((m) => m.type).filter((t) => t.startsWith('poll:'))).toEqual(['poll:open', 'poll:close', 'poll:result'])
    expect(p.inbox.some((m) => m.type === 'poll:result')).toBe(true)
    for (const c of [p, a, b]) c.ws.close()
  })

  it('a presenter reset re-snapshots everyone', async () => {
    const p = new Client()
    await p.join({ type: 'hello', role: 'presenter', clientId: 'p', token: TOKEN })
    const a = new Client()
    await a.join({ type: 'hello', role: 'audience', clientId: 'a' })
    p.send({ type: 'poll:open', poll: { id: 'q', kind: 'poll', question: '?', options: ['a', 'b'] } })
    await a.next((m) => m.type === 'poll:open')
    p.send({ type: 'reset' })
    const states = await a.next((m) => m.type === 'state' && m.poll === null)
    expect(states.poll).toBeNull()
    for (const c of [p, a]) c.ws.close()
  })
})

describe('rate limit', () => {
  it('warns, then closes a socket that floods', async () => {
    const c = new Client()
    await c.join({ type: 'hello', role: 'audience', clientId: 'flood' })
    const closed = c.closed()
    // Well past burst (10) plus strikes (10) in one go.
    for (let i = 0; i < 60; i++) c.send({ type: 'vote', pollId: 'none', option: 0 })
    expect(await closed).toBe(1008)
    expect(c.inbox.some((m) => m.type === 'error' && /slow down/.test(m.reason))).toBe(true)
  })

  it('leaves a steady client alone', async () => {
    const c = new Client()
    await c.join({ type: 'hello', role: 'audience', clientId: 'steady' })
    for (let i = 0; i < 8; i++) c.send({ type: 'message', text: `m${i}` })
    await sleep(100)
    expect(c.ws.readyState).toBe(WebSocket.OPEN)
    expect(c.inbox.some((m) => m.type === 'error' && /slow down/.test(m.reason))).toBe(false)
    c.ws.close()
  })
})

describe('static routes', () => {
  const get = (path: string) => fetch(`http://127.0.0.1:${port}${path}`)

  it('serves the deck, the join page, hashed assets, and the SPA fallback', async () => {
    expect((await get('/')).status).toBe(200)
    expect(await (await get('/join')).text()).toContain('join')
    const asset = await get('/assets/app-abc123.js')
    expect(asset.headers.get('cache-control')).toContain('immutable')
    expect((await get('/12')).status).toBe(200)
    expect((await get('/presenter/3')).status).toBe(200)
    expect((await get('/assets/missing.js')).status).toBe(404)
    const health = await (await get('/health')).json()
    expect(health).toMatchObject({ ok: true, connections: 0 })
  })

  it('refuses paths that escape dist, including a sibling named dist-*', async () => {
    expect((await get('/assets/..%2f..%2fpackage.json')).status).toBe(400)
    expect((await get('/..%2fdist-sibling%2fsecret.txt')).status).toBe(400)
    expect((await get('/%ZZ')).status).toBe(400)
    expect((await fetch(`http://127.0.0.1:${port}/health`, { method: 'POST' })).status).toBe(405)
  })
})
