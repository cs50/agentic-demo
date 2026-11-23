/**
 * index.ts — the hub's entry point: read the environment, build the server
 * (app.ts), listen, and shut down cleanly.
 *
 *   node --experimental-strip-types server/index.ts
 *   (or `pnpm hub` from the repo root, which also reads .env.local)
 *
 * Environment:
 *   PORT              default 8080 (what the Dockerfile exposes and EB's nginx proxies to)
 *   PRESENTER_TOKEN   the secret the presenter's deck sends in `hello`.
 *                     Required in production (NODE_ENV=production): the hub
 *                     refuses to start without it, so a misconfigured
 *                     environment fails its health check instead of accepting
 *                     a guessable token. Elsewhere, unset means a random token
 *                     is generated and printed once.
 *   DIST_DIR          where `slidev build` put the deck; default ../dist
 */

import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { createHubServer } from './app.ts'
import { Hub } from './hub.ts'
import { WS_PATH } from './protocol.ts'

const PORT = Number(process.env.PORT) || 8080
const DIST_DIR = resolve(import.meta.dirname, process.env.DIST_DIR ?? '../dist')
const PUBLIC_DIR = resolve(import.meta.dirname, 'public')

let presenterToken = process.env.PRESENTER_TOKEN
if (!presenterToken) {
  if (process.env.NODE_ENV === 'production') {
    console.error('PRESENTER_TOKEN is not set. Refusing to start: without it anyone could present. Set it as an environment property.')
    process.exit(1)
  }
  presenterToken = randomUUID()
  console.warn(`PRESENTER_TOKEN is not set; using a random one for this run: ${presenterToken}`)
  console.warn('Put PRESENTER_TOKEN in .env.local so the deck and the hub agree (see .env.example).')
}

const hub = new Hub({ presenterToken })
const app = createHubServer({ hub, distDir: DIST_DIR, publicDir: PUBLIC_DIR })

app.server.listen(PORT, () => {
  console.log(`hub listening on http://localhost:${PORT}  (deck: ${DIST_DIR}, join: /join, ws: ${WS_PATH})`)
})

function shutdown() {
  app.close().then(() => process.exit(0))
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
