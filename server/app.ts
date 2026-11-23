/**
 * app.ts — the hub process, minus the environment: one HTTP server that
 * serves the built deck and the audience page, and one websocket endpoint
 * that the deck and the phones talk to. All session rules live in hub.ts;
 * this file only moves bytes. index.ts reads the environment and calls
 * `createHubServer`; tests call it directly on port 0.
 *
 * Routes:
 *   /health           200 and a small JSON body, for the load balancer
 *   /join             the audience page (server/public/join.html)
 *   /ws               the websocket (see protocol.ts)
 *   /assets/*         the deck's hashed bundles, cached for a year
 *   everything else   the deck's index.html (Slidev routes like /12 or /presenter/3
 *                     are resolved in the browser), or the file if one exists
 *
 * Keepalive: the ALB and EB's nginx both drop a connection idle for 60 s. The
 * server pings every `pingMs` and closes sockets that stop answering.
 *
 * Abuse: every frame from a joined socket passes a token bucket; a socket that
 * keeps exceeding it is closed with 1008. Honest clients send a few frames a
 * minute; the presenter's cursor is throttled to ~16/s on its side.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { promises as fs, createReadStream } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { pipeline } from 'node:stream'
import { WebSocketServer, type WebSocket } from 'ws'
import { Hub, targets, type Outbound } from './hub.ts'
import { WS_PATH, type ClientMessage, type Role, type ServerMessage } from './protocol.ts'

export interface HubServerOptions {
  hub: Hub
  /** Where `slidev build` put the deck. */
  distDir: string
  /** Where join.html lives. */
  publicDir: string
  /** Live tallies are coalesced so 500 near-simultaneous votes cost the presenter a few frames, not 500. */
  tallyFlushMs?: number
  pingMs?: number
  /** Generous for JSON control messages and a few KB of live source; stops a client from sending megabytes. */
  maxPayload?: number
  /** Inbound frames a socket may send per second, sustained; `rateBurst` on top of that. */
  ratePerSecond?: number
  rateBurst?: number
}

export interface HubServer {
  server: Server
  /** Open sockets, for tests and /health. */
  socketCount: () => number
  close: () => Promise<void>
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

async function sendFile(res: ServerResponse, path: string, cacheControl: string): Promise<boolean> {
  let stat
  try {
    stat = await fs.stat(path)
  } catch {
    return false
  }
  if (!stat.isFile()) return false
  res.writeHead(200, {
    'Content-Type': MIME[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  })
  // pipeline() destroys the read stream if the client goes away mid-file.
  pipeline(createReadStream(path), res, () => {})
  return true
}

/** Resolve a URL path inside `root`, or null if it tries to escape (including to a sibling `root*`). */
function safeJoin(root: string, urlPath: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return null
  }
  const path = normalize(join(root, decoded))
  return path === root || path.startsWith(root + sep) ? path : null
}

export function createHubServer(opts: HubServerOptions): HubServer {
  const hub = opts.hub
  const DIST_DIR = resolve(opts.distDir)
  const PUBLIC_DIR = resolve(opts.publicDir)
  const TALLY_FLUSH_MS = opts.tallyFlushMs ?? 250
  const PING_MS = opts.pingMs ?? 25_000
  const MAX_PAYLOAD = opts.maxPayload ?? 256 * 1024
  const RATE_PER_SECOND = opts.ratePerSecond ?? 20
  const RATE_BURST = opts.rateBurst ?? 40

  // ----------------------------------------------------------------- http

  async function handleHttp(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const pathname = url.pathname

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end()
      return
    }

    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(
        JSON.stringify({
          ok: true,
          connections: hub.connectionCount(),
          audience: hub.audienceCount(),
          rssMb: Math.round(process.memoryUsage().rss / 1048576),
          uptimeS: Math.round(process.uptime()),
        }),
      )
      return
    }

    if (pathname === '/join' || pathname === '/join/') {
      if (await sendFile(res, join(PUBLIC_DIR, 'join.html'), 'no-cache')) return
    }

    const target = safeJoin(DIST_DIR, pathname)
    if (!target) {
      res.writeHead(400).end()
      return
    }

    if (pathname.startsWith('/assets/')) {
      if (await sendFile(res, target, 'public, max-age=31536000, immutable')) return
      res.writeHead(404).end()
      return
    }

    if (extname(pathname) && (await sendFile(res, target, 'no-cache'))) return

    // Slidev's client-side routes, and anything else: the app shell.
    if (await sendFile(res, join(DIST_DIR, 'index.html'), 'no-cache')) return
    res
      .writeHead(503, { 'Content-Type': 'text/plain' })
      .end('The deck has not been built. Run `pnpm build`, or point DIST_DIR at a build.\n')
  }

  // ------------------------------------------------------------ websocket

  interface Socket {
    ws: WebSocket
    connId: string
    alive: boolean
    /** Set once the client's `hello` has been accepted. */
    joined: boolean
    /** Token bucket: frames allowed right now, refilled at RATE_PER_SECOND. */
    tokens: number
    refilledAt: number
    /** Consecutive refused frames; sustained excess closes the socket. */
    strikes: number
  }

  const sockets = new Map<string, Socket>()

  function send(ws: WebSocket, msg: ServerMessage) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
  }

  let tallyTimer: NodeJS.Timeout | null = null

  function flushTally() {
    tallyTimer = null
    const tally = hub.tally()
    if (!tally) return
    deliver([{ to: { kind: 'role', role: 'presenter' }, msg: { type: 'tally', ...tally } }], { raw: true })
  }

  /** Send each Outbound to the sockets it targets. */
  function deliver(out: Outbound[], o: { raw?: boolean } = {}) {
    for (const { to, msg } of out) {
      // Tallies are coalesced: however many arrive within TALLY_FLUSH_MS, presenters see one.
      if (msg.type === 'tally' && !o.raw) {
        if (!tallyTimer) tallyTimer = setTimeout(flushTally, TALLY_FLUSH_MS)
        continue
      }
      if (to.kind === 'conn') {
        const s = sockets.get(to.id)
        if (s) send(s.ws, msg)
        continue
      }
      const payload = JSON.stringify(msg)
      for (const s of sockets.values()) {
        if (!s.joined) continue
        const role: Role = hub.roleOf(s.connId) ?? 'audience'
        if (targets(to, s.connId, role) && s.ws.readyState === s.ws.OPEN) s.ws.send(payload)
      }
    }
    armChoiceTimer()
  }

  let choiceTimer: NodeJS.Timeout | null = null

  /** A timed poll closes itself: keep one timer pointed at the hub's deadline. */
  function armChoiceTimer() {
    if (choiceTimer) {
      clearTimeout(choiceTimer)
      choiceTimer = null
    }
    const at = hub.closesAt()
    if (at === null) return
    // setTimeout overflows past 2^31-1 ms; cap and re-arm from tick() if still open.
    choiceTimer = setTimeout(
      () => {
        choiceTimer = null
        deliver(hub.tick())
      },
      Math.min(Math.max(0, at - Date.now()), 2_147_000_000),
    )
  }

  /** Take one token for this frame; false when the socket is over its budget. */
  function admit(s: Socket): boolean {
    const now = Date.now()
    s.tokens = Math.min(RATE_BURST, s.tokens + ((now - s.refilledAt) / 1000) * RATE_PER_SECOND)
    s.refilledAt = now
    if (s.tokens >= 1) {
      s.tokens -= 1
      s.strikes = 0
      return true
    }
    s.strikes++
    return false
  }

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD })

  wss.on('connection', (ws: WebSocket) => {
    const connId = randomUUID()
    const socket: Socket = { ws, connId, alive: true, joined: false, tokens: RATE_BURST, refilledAt: Date.now(), strikes: 0 }
    sockets.set(connId, socket)

    ws.on('pong', () => (socket.alive = true))

    ws.on('message', (data) => {
      if (!admit(socket)) {
        if (socket.strikes > RATE_BURST) ws.close(1008, 'too many messages')
        else if (socket.strikes === 1) send(ws, { type: 'error', reason: 'slow down' })
        return
      }
      let msg: ClientMessage
      try {
        msg = JSON.parse(data.toString())
      } catch {
        send(ws, { type: 'error', reason: 'messages must be JSON' })
        return
      }
      if (!socket.joined) {
        if (msg?.type !== 'hello') {
          send(ws, { type: 'error', reason: 'say hello first' })
          return
        }
        socket.joined = true
        deliver(hub.connect(connId, msg))
        return
      }
      deliver(hub.handle(connId, msg))
    })

    ws.on('close', () => {
      sockets.delete(connId)
      deliver(hub.disconnect(connId))
    })

    ws.on('error', (err) => {
      console.error(`ws ${connId}: ${err.message}`)
    })
  })

  const pinger = setInterval(() => {
    for (const s of sockets.values()) {
      if (!s.alive) {
        s.ws.terminate()
        continue
      }
      s.alive = false
      s.ws.ping()
    }
  }, PING_MS)

  // --------------------------------------------------------------- server

  const server = createServer((req, res) => {
    handleHttp(req, res).catch((err) => {
      console.error(err)
      if (!res.headersSent) res.writeHead(500)
      res.end()
    })
  })

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname !== WS_PATH) {
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
  })

  function close(): Promise<void> {
    clearInterval(pinger)
    if (tallyTimer) clearTimeout(tallyTimer)
    if (choiceTimer) clearTimeout(choiceTimer)
    for (const s of sockets.values()) s.ws.close(1001, 'server shutting down')
    return new Promise((done) => {
      server.close(() => done())
      // Don't hang on a straggler.
      setTimeout(done, 2000).unref()
    })
  }

  return { server, socketCount: () => sockets.size, close }
}
