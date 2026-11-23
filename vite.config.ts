import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

// Note: `vite` is a dependency of Slidev, not of this project, and pnpm keeps
// transitive packages out of reach. So this file uses no imports from 'vite';
// Slidev merges the exported object into its own Vite config.

/**
 * The files the slide-deck editor may write. Everything else is refused.
 * Mirrors Slidev's own `{monaco-write}` mechanism, but for a component we
 * control, so disk changes can flow back into the editor without re-rendering
 * the slide (which would restart the game). Kept in step with LIVE_FILES in
 * demo/mario/liveSource.ts (this file cannot import it: Slidev loads the
 * config with Node, before Vite is up).
 */
const WRITABLE_FILES = ['demo/mario/level.ts', 'demo/mario/physics.ts']

/**
 * Only clients on this machine may write. Vite's own websocket guard checks a
 * token only when a browser sends an `Origin` header; a plain websocket client
 * (no Origin) is let through, so under `slidev --remote` anyone on the room's
 * network could otherwise write level.ts and have the presenter's browser run
 * it. Remote devices still get the deck, HMR, and the Preview panel.
 */
function isLoopback(address: string | undefined): boolean {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function liveFileWriter() {
  return {
    name: 'lecture:live-file-writer',
    apply: 'serve' as const,
    configureServer(server: any) {
      const localClients = new WeakSet<object>()
      // Writes are queued so two saves arriving within one write's latency
      // (autosave then Cmd+S, or the slide and presenter views) cannot
      // interleave on disk or land out of order. A failed write does not
      // block the ones behind it.
      let queue: Promise<unknown> = Promise.resolve()

      server.ws.on('connection', (socket: object, req: { socket?: { remoteAddress?: string } }) => {
        if (isLoopback(req?.socket?.remoteAddress)) localClients.add(socket)
      })

      server.ws.on('lecture:write-file', (data: { file?: unknown; content?: unknown }, client: any) => {
        const file = typeof data?.file === 'string' ? data.file : ''
        const reply = (result: { ok: boolean; error?: string }) =>
          client.send('lecture:write-file:result', { file, ...result })
        if (!localClients.has(client.socket)) {
          reply({ ok: false, error: 'writes are only accepted from the machine running the dev server' })
          return
        }
        if (!WRITABLE_FILES.includes(file)) {
          reply({ ok: false, error: `${file || '(no file)'} is not a writable file` })
          return
        }
        if (typeof data?.content !== 'string') {
          reply({ ok: false, error: 'content must be a string' })
          return
        }
        const target = resolve(server.config.root, file)
        const content = data.content
        queue = queue.then(async () => {
          try {
            await fs.writeFile(target, content, 'utf8')
            reply({ ok: true })
          } catch (e) {
            reply({ ok: false, error: String(e) })
          }
        })
      })
    },
  }
}

export default {
  plugins: [liveFileWriter()],
  server: {
    hmr: {
      // A syntax error in level.ts or physics.ts should show up in the game's
      // own error strip (see liveModule.ts), not as a full-screen overlay mid-lecture.
      overlay: false,
    },
  },
}
