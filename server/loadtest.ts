/**
 * loadtest.ts — the room, simulated: N phones against a running hub.
 *
 *   pnpm hub:loadtest                       500 phones against ws://localhost:8080/ws
 *   pnpm hub:loadtest wss://host/ws 300     another hub, another size
 *
 * Needs PRESENTER_TOKEN (default "dev", the hub's own default) so the script
 * can act as the presenter. What it measures:
 *
 *   join       all N connect and say hello; how long until the last snapshot
 *   vote       a poll opens, every phone votes at once; round-trip to ack
 *              (p50/p95/max) and that the presenter's final tally is N
 *   follow     the presenter walks 20 slides; per step, how long until the
 *              last phone has the new position
 *   source     10 saves of a ~1 KB live file; same fan-out measurement
 *   memory     the hub's RSS before and after, from /health
 *
 * Exits non-zero if a tally is short, a phone is lost, or fan-out is slow,
 * so it can gate a deploy.
 */

import WebSocket from 'ws'

const url = process.argv[2] ?? 'ws://localhost:8080/ws'
const N = Number(process.argv[3] ?? 500)
const token = process.env.PRESENTER_TOKEN ?? 'dev'
const healthUrl = url.replace(/^ws/, 'http').replace(/\/ws$/, '/health')

const NAV = 'The Agentic Software Engineer — CS50 - shared'
const LIVE_FILE = 'demo/mario/level.ts'
const SOURCE = `export function buildLevel(): string[] {\n${'  // '.padEnd(60, 'x')}\n`.repeat(14) + '  return []\n}\n'

type Msg = Record<string, any>

class Phone {
  ws!: WebSocket
  handlers = new Set<(m: Msg) => void>()
  readonly id: string
  constructor(id: string) {
    this.id = id
  }
  connect(hello: Msg): Promise<Msg> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url, { perMessageDeflate: false })
      this.ws.on('error', reject)
      this.ws.on('open', () => this.ws.send(JSON.stringify(hello)))
      this.ws.on('message', (d) => {
        const m = JSON.parse(d.toString())
        for (const h of this.handlers) h(m)
      })
      this.once((m) => m.type === 'state', resolve)
    })
  }
  send(m: Msg) {
    this.ws.send(JSON.stringify(m))
  }
  once(test: (m: Msg) => boolean, cb: (m: Msg) => void) {
    const h = (m: Msg) => {
      if (!test(m)) return
      this.handlers.delete(h)
      cb(m)
    }
    this.handlers.add(h)
  }
  waitFor(test: (m: Msg) => boolean, timeoutMs = 10_000): Promise<Msg> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${this.id}: timed out`)), timeoutMs)
      this.once(test, (m) => {
        clearTimeout(t)
        resolve(m)
      })
    })
  }
}

const now = () => performance.now()
const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? 0
}
const ms = (x: number) => `${x.toFixed(0)} ms`
const sleep = (t: number) => new Promise((r) => setTimeout(r, t))

async function health(): Promise<{ connections: number; audience: number; rssMb?: number }> {
  return (await fetch(healthUrl)).json()
}

let failed = false
function check(ok: boolean, what: string) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`)
  if (!ok) failed = true
}

/** Fan out one presenter message and time the slowest phone to receive it. */
async function fanout(label: string, phones: Phone[], send: () => void, test: (m: Msg) => boolean) {
  const t0 = now()
  const waits = phones.map((p) => p.waitFor(test))
  send()
  await Promise.all(waits)
  const dt = now() - t0
  return dt
}

async function main() {
  console.log(`hub ${url}, ${N} phones`)
  const before = await health()
  console.log(`before: ${before.connections} connections, rss ${before.rssMb ?? '?'} MB`)

  // ---------------------------------------------------------------- presenter
  const presenter = new Phone('presenter')
  const pstate = await presenter.connect({ type: 'hello', role: 'presenter', clientId: 'loadtest-presenter', token })
  check(pstate.you.role === 'presenter', 'presenter token accepted')
  presenter.send({ type: 'reset' })
  await presenter.waitFor((m) => m.type === 'state')

  // --------------------------------------------------------------------- join
  const phones = Array.from({ length: N }, (_, i) => new Phone(`phone-${i}`))
  let t0 = now()
  // Connect in waves of 50 so the test machine, not the hub, is not the bottleneck.
  for (let i = 0; i < phones.length; i += 50) {
    await Promise.all(phones.slice(i, i + 50).map((p) => p.connect({ type: 'hello', role: 'audience', clientId: p.id, name: `Student ${p.id}` })))
  }
  const joinMs = now() - t0
  await sleep(300)
  const joined = await health()
  console.log(`join: ${N} phones connected in ${ms(joinMs)}; hub sees ${joined.audience} audience, rss ${joined.rssMb ?? '?'} MB`)
  check(joined.audience >= N, `hub counts ${N} audience devices`)

  // --------------------------------------------------------------------- vote
  const poll = { id: 'load', kind: 'poll', question: 'Load?', options: ['A', 'B', 'C', 'D'] }
  await fanout('poll:open', phones, () => presenter.send({ type: 'poll:open', poll }), (m) => m.type === 'poll:open')
  const rtts: number[] = []
  const finalTally = presenter.waitFor((m) => m.type === 'tally' && m.total === N, 15_000)
  t0 = now()
  await Promise.all(
    phones.map((p, i) => {
      const sent = now()
      const ack = p.waitFor((m) => m.type === 'vote:ack')
      p.send({ type: 'vote', pollId: poll.id, option: i % 4 })
      return ack.then(() => rtts.push(now() - sent))
    }),
  )
  const tally = await finalTally.catch(() => null)
  console.log(`vote: ${N} votes acked in ${ms(now() - t0)}; rtt p50 ${ms(pct(rtts, 50))}, p95 ${ms(pct(rtts, 95))}, max ${ms(Math.max(...rtts))}`)
  check(!!tally && tally.total === N, `presenter's tally reaches ${N} (got ${tally?.total ?? 'none'}, counts ${JSON.stringify(tally?.counts)})`)
  check(pct(rtts, 95) < 200, 'vote round-trip p95 under 200 ms')
  await fanout('poll:close', phones, () => presenter.send({ type: 'poll:close', pollId: poll.id }), (m) => m.type === 'poll:close')

  // ------------------------------------------------------------------- follow
  const steps: number[] = []
  for (let page = 1; page <= 20; page++) {
    const state = { page, clicks: 0, clicksTotal: 0, timer: {}, lastUpdate: { id: 'load', type: 'presenter', time: Date.now() } }
    steps.push(await fanout('sync', phones, () => presenter.send({ type: 'sync', channel: NAV, state }), (m) => m.type === 'sync' && m.state?.page === page))
  }
  console.log(`follow: 20 slide steps to ${N} phones; fan-out p50 ${ms(pct(steps, 50))}, p95 ${ms(pct(steps, 95))}, max ${ms(Math.max(...steps))}`)
  check(pct(steps, 95) < 250, 'slide fan-out p95 under 250 ms')

  // ------------------------------------------------------------------- source
  const saves: number[] = []
  for (let i = 0; i < 10; i++) {
    const content = `// save ${i}\n${SOURCE}`
    saves.push(await fanout('live-source', phones, () => presenter.send({ type: 'live-source', file: LIVE_FILE, content }), (m) => m.type === 'live-source' && m.content.startsWith(`// save ${i}\n`)))
  }
  console.log(`source: 10 saves of ${SOURCE.length} bytes to ${N} phones; fan-out p50 ${ms(pct(saves, 50))}, p95 ${ms(pct(saves, 95))}, max ${ms(Math.max(...saves))}`)
  check(pct(saves, 95) < 500, 'live-source fan-out p95 under 500 ms')

  // ------------------------------------------------------------------- memory
  const after = await health()
  console.log(`after: ${after.connections} connections, rss ${after.rssMb ?? '?'} MB`)
  check(after.connections === before.connections + N + 1, `no phone was dropped (${after.connections - before.connections - 1} of ${N} still connected)`)
  if (after.rssMb !== undefined) check(after.rssMb < 400, `hub rss under 400 MB with ${N} phones`)

  presenter.send({ type: 'reset' })
  await sleep(200)
  for (const p of phones) p.ws.close()
  presenter.ws.close()
  await sleep(500)
  const gone = await health()
  console.log(`closed: ${gone.connections} connections remain, rss ${gone.rssMb ?? '?'} MB`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
