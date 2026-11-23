/**
 * index.ts — the hub process: one HTTP server that serves the built deck and
 * the audience page, and one websocket endpoint that the deck and the phones
 * talk to. All session rules live in hub.ts; this file only moves bytes.
 *
 *   node --experimental-strip-types server/index.ts
 *   (or `pnpm hub` from the repo root)
 *
 * Environment:
 *   PORT              default 8080 (what the Dockerfile exposes and EB's nginx proxies to)
 *   PRESENTER_TOKEN   the secret the presenter's deck sends in `hello`. Unset
 *                     means "dev": fine on a laptop, never on the hosted env.
 *   DIST_DIR          where `slidev build` put the deck; default ../dist
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
 * server pings every PING_MS and closes sockets that stop answering.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { promises as fs, createReadStream } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { WebSocketServer, type WebSocket } from 'ws'
import { Hub, targets, type Outbound } from './hub.ts'
import { WS_PATH, type ClientMessage, type Role, type ServerMessage } from './protocol.ts'

const PORT = Number(process.env.PORT) || 8080
const DIST_DIR = resolve(import.meta.dirname, process.env.DIST_DIR ?? '../dist')
const PUBLIC_DIR = resolve(import.meta.dirname, 'public')
const PING_MS = 25_000
/** Live tallies are coalesced so 500 near-simultaneous votes cost the presenter a few frames, not 500. */
const TALLY_FLUSH_MS = 250
/** Generous for JSON control messages and a few KB of live source; stops a client from sending megabytes. */
const MAX_PAYLOAD = 256 * 1024

const presenterToken = process.env.PRESENTER_TOKEN || 'dev'
if (!process.env.PRESENTER_TOKEN) {
  console.warn('PRESENTER_TOKEN is not set; using "dev". Set it before exposing this server to a room.')
}

const hub = new Hub({ presenterToken })

// ----------------------------------------------------------------- static

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
  createReadStream(path).pipe(res)
  return true
}

/** Resolve a URL path inside `root`, or null if it tries to escape. */
function safeJoin(root: string, urlPath: string): string | null {
  const path = normalize(join(root, decodeURIComponent(urlPath)))
  return path.startsWith(root) ? path : null
}

async function handleHttp(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const pathname = url.pathname

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  if (pathname === '/health') {
    res
      .writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      .end(JSON.stringify({ ok: true, connections: hub.connectionCount(), audience: hub.audienceCount() }))
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

// -------------------------------------------------------------- websocket

interface Socket {
  ws: WebSocket
  connId: string
  alive: boolean
  /** Set once the client's `hello` has been accepted. */
  joined: boolean
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
function deliver(out: Outbound[], opts: { raw?: boolean } = {}) {
  for (const { to, msg } of out) {
    // Tallies are coalesced: however many arrive within TALLY_FLUSH_MS, presenters see one.
    if (msg.type === 'tally' && !opts.raw) {
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
  choiceTimer = setTimeout(() => {
    choiceTimer = null
    deliver(hub.tick())
  }, Math.max(0, at - Date.now()))
}

const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD })

wss.on('connection', (ws: WebSocket) => {
  const connId = randomUUID()
  const socket: Socket = { ws, connId, alive: true, joined: false }
  sockets.set(connId, socket)

  ws.on('pong', () => (socket.alive = true))

  ws.on('message', (data) => {
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

// ----------------------------------------------------------------- server

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

server.listen(PORT, () => {
  console.log(`hub listening on http://localhost:${PORT}  (deck: ${DIST_DIR}, join: /join, ws: ${WS_PATH})`)
})

function shutdown() {
  clearInterval(pinger)
  if (tallyTimer) clearTimeout(tallyTimer)
  if (choiceTimer) clearTimeout(choiceTimer)
  for (const s of sockets.values()) s.ws.close(1001, 'server shutting down')
  server.close(() => process.exit(0))
  // Don't hang on a straggler.
  setTimeout(() => process.exit(0), 2000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
