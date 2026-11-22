import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

// Note: `vite` is a dependency of Slidev, not of this project, and pnpm keeps
// transitive packages out of reach. So this file uses no imports from 'vite';
// Slidev merges the exported object into its own Vite config.

/**
 * The one file the slide-deck editor may write. Everything else is refused.
 * Mirrors Slidev's own `{monaco-write}` mechanism, but for a component we
 * control, so disk changes can flow back into the editor without re-rendering
 * the slide (which would restart the game).
 */
const WRITABLE_FILE = 'demo/mario/level.ts'

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

function liveLevelWriter() {
  return {
    name: 'lecture:live-level-writer',
    apply: 'serve' as const,
    configureServer(server: any) {
      const target = resolve(server.config.root, WRITABLE_FILE)
      const localClients = new WeakSet<object>()

      server.ws.on('connection', (socket: object, req: { socket?: { remoteAddress?: string } }) => {
        if (isLoopback(req?.socket?.remoteAddress)) localClients.add(socket)
      })

      server.ws.on('lecture:write-level', async (data: { content?: unknown }, client: any) => {
        if (!localClients.has(client.socket)) {
          client.send('lecture:write-level:result', {
            ok: false,
            error: 'writes are only accepted from the machine running the dev server',
          })
          return
        }
        if (typeof data?.content !== 'string') {
          client.send('lecture:write-level:result', { ok: false, error: 'content must be a string' })
          return
        }
        try {
          await fs.writeFile(target, data.content, 'utf8')
          client.send('lecture:write-level:result', { ok: true })
        } catch (e) {
          client.send('lecture:write-level:result', { ok: false, error: String(e) })
        }
      })
    },
  }
}

export default {
  plugins: [liveLevelWriter()],
  server: {
    hmr: {
      // A syntax error in level.ts should show up in the game's own error
      // strip (see liveLevel.ts), not as a full-screen overlay mid-lecture.
      overlay: false,
    },
  },
}
