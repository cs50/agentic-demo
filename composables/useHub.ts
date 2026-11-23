/**
 * useHub — the deck's one connection to the audience hub (server/).
 *
 * A module-level singleton: every component and the sync bridge share one
 * websocket, one reactive view of the session, and one reconnect loop. Nothing
 * connects until something calls `connect()`, and only the live slide and
 * presenter views do, so export, overview and the "next slide" preview never
 * open a socket.
 *
 * Where it connects: VITE_HUB_URL (see .env.example), else the page's own
 * origin, which is right for the hosted deck (the hub serves it).
 *
 * Who it is: a presenter if a token is known, else audience. The token is
 * never in the built bundle and never in a URL the server sees. Open the deck
 * once with `#presenter=TOKEN` (the fragment stays in the browser; query
 * strings end up in nginx logs) and it is kept in localStorage; `#presenter=`
 * forgets it. Under `pnpm dev` it can also come from VITE_PRESENTER_TOKEN in
 * .env.local. Audience devices share the same `hub:clientId` key as /join, so
 * a phone that voted on the join page and then follows the deck is still one
 * voter.
 *
 * Slide position and the live demo's source arrive here too but are consumed
 * by composables/hubSync.ts straight from the message listener (`on`), not
 * kept in `state`: 500 phones need not hold a copy of the drawings.
 */
import { computed, reactive, readonly, shallowRef, watch } from 'vue'
import {
  WS_PATH,
  type AudienceMessage,
  type ClientMessage,
  type Poll,
  type PollResult,
  type Role,
  type ServerMessage,
  type Tally,
} from '../server/protocol'

const CLIENT_ID_KEY = 'hub:clientId'
const TOKEN_KEY = 'hub:presenterToken'
const NAME_KEY = 'hub:name'

/** Minted once per `pnpm dev` start (vite.config.ts `define`); absent in a build. */
declare const __HUB_SESSION__: string | undefined
const SESSION = typeof __HUB_SESSION__ === 'string' && import.meta.env.DEV ? __HUB_SESSION__ : undefined

type Listener = (msg: ServerMessage) => void

const state = reactive({
  connected: false,
  /** What the server says we are, once it has answered `hello`. */
  role: 'audience' as Role,
  /**
   * True when this deck offered a presenter token and the hub turned it down
   * (stale localStorage, `.env.local` out of date, a rotated environment
   * property). The deck is then audience, and the lecturer needs to know.
   */
  presenterRejected: false,
  audienceCount: 0,
  poll: null as Poll | null,
  tally: null as Tally | null,
  result: null as PollResult | null,
  /** This device's vote on the current poll. */
  vote: null as number | null,
  messages: [] as AudienceMessage[],
  /** Server clock minus ours, for countdowns. */
  clockSkew: 0,
})

const listeners = new Set<Listener>()
const socket = shallowRef<WebSocket | null>(null)
let wanted = false
let backoff = 1000
let retryTimer = 0
/** Whether the last `hello` carried a token, so a `state` reply of `audience` means it was rejected. */
let offeredToken = false

// ------------------------------------------------------------- identity

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function clientId(): string {
  const s = storage()
  let id = s?.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Math.random()}`.slice(2) + Date.now()
    s?.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

/**
 * `#presenter=TOKEN` in the address bar when the deck loads stores the token;
 * `#presenter=` forgets it. Read and removed at module load, before Slidev's
 * router is created, so the router never sees it, it is not left in history,
 * and the fragment never reaches a server. In dev, .env.local can supply the
 * token instead.
 */
function takeFragmentToken(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#/, '')
  const param = hash ? new URLSearchParams(hash).get('presenter') : null
  if (param === null) return null
  const s = storage()
  if (param) s?.setItem(TOKEN_KEY, param)
  else s?.removeItem(TOKEN_KEY)
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  return param || null
}
takeFragmentToken()

function presenterToken(): string | null {
  const stored = storage()?.getItem(TOKEN_KEY) ?? null
  if (stored) return stored
  // Only under `pnpm dev`: a production build must never carry the token, since
  // the hosted deck is what the room loads. Vite reads VITE_* from .env.local.
  if (import.meta.env.DEV) return (import.meta.env.VITE_PRESENTER_TOKEN as string | undefined)?.trim() || null
  return null
}

// ---------------------------------------------------------------- urls

/** The hub's websocket URL. */
export function hubUrl(): string {
  const configured = (import.meta.env.VITE_HUB_URL as string | undefined)?.trim()
  const base = configured || (typeof window !== 'undefined' ? window.location.origin : '')
  return base.replace(/^http/, 'ws').replace(/\/+$/, '') + WS_PATH
}

/** The page phones should open; what the QR code encodes. */
export function joinUrl(): string {
  return hubUrl().replace(/^ws/, 'http').replace(new RegExp(`${WS_PATH}$`), '') + '/join'
}

// --------------------------------------------------------------- socket

function connect() {
  wanted = true
  if (socket.value || typeof window === 'undefined') return
  const ws = new WebSocket(hubUrl())
  socket.value = ws

  ws.addEventListener('open', () => {
    backoff = 1000
    state.connected = true
    const token = presenterToken()
    offeredToken = !!token
    send({
      type: 'hello',
      role: token ? 'presenter' : 'audience',
      clientId: clientId(),
      name: storage()?.getItem(NAME_KEY) || undefined,
      token: token ?? undefined,
      // A new run of the dev deck is a new lecture; the hub clears the last one.
      session: token ? SESSION : undefined,
    })
  })

  ws.addEventListener('message', (e) => {
    let msg: ServerMessage
    try {
      msg = JSON.parse(e.data)
    } catch {
      return
    }
    apply(msg)
    for (const fn of listeners) fn(msg)
  })

  ws.addEventListener('close', () => {
    socket.value = null
    state.connected = false
    if (!wanted) return
    window.clearTimeout(retryTimer)
    retryTimer = window.setTimeout(connect, backoff)
    backoff = Math.min(backoff * 2, 10_000)
  })

  ws.addEventListener('error', () => ws.close())
}

function send(msg: ClientMessage): boolean {
  const ws = socket.value
  if (!ws || ws.readyState !== WebSocket.OPEN) return false
  ws.send(JSON.stringify(msg))
  return true
}

function apply(msg: ServerMessage) {
  switch (msg.type) {
    case 'state':
      state.role = msg.you.role
      state.presenterRejected = offeredToken && msg.you.role !== 'presenter'
      state.poll = msg.poll
      state.tally = msg.tally
      state.result = msg.result
      state.vote = msg.vote
      state.audienceCount = msg.audienceCount
      state.clockSkew = msg.now - Date.now()
      break
    case 'audience':
      state.audienceCount = msg.count
      break
    case 'poll:open':
      state.poll = msg.poll
      state.tally = null
      state.result = null
      state.vote = null
      break
    case 'tally':
      if (state.poll?.id === msg.pollId) state.tally = { pollId: msg.pollId, counts: msg.counts, total: msg.total }
      break
    case 'poll:close':
      if (state.poll?.id === msg.pollId) {
        state.poll = { ...state.poll, open: false }
        state.tally = { pollId: msg.pollId, counts: msg.counts, total: msg.total }
      }
      break
    case 'poll:result':
      if (state.poll?.id === msg.pollId) {
        state.poll = { ...state.poll, open: false }
        state.tally = { pollId: msg.pollId, counts: msg.counts, total: msg.total }
        state.result = { pollId: msg.pollId, counts: msg.counts, total: msg.total, winner: msg.winner }
      }
      break
    case 'vote:ack':
      if (state.poll?.id === msg.pollId) state.vote = msg.option
      break
    case 'message':
      state.messages.push({ from: msg.from, text: msg.text, at: msg.at })
      if (state.messages.length > 200) state.messages.splice(0, state.messages.length - 200)
      break
    case 'sync':
    case 'live-source':
      // Consumed by composables/hubSync.ts through `on`; nothing is kept here.
      break
    case 'error':
      if (import.meta.env.DEV) console.warn(`[hub] ${msg.reason}`)
      break
  }
}

// ------------------------------------------------------------- actions

const isPresenter = computed(() => state.connected && state.role === 'presenter')

function openPoll(poll: { id: string; kind?: Poll['kind']; question: string; options: string[]; durationMs?: number }) {
  if (!isPresenter.value) return false
  return send({ type: 'poll:open', poll: { kind: 'poll', ...poll } })
}

function closePoll(pollId: string) {
  if (!isPresenter.value) return false
  return send({ type: 'poll:close', pollId })
}

/** Casts a vote. False when nothing was sent (no open poll, or the socket is down), so the UI can say so. */
function vote(option: number): boolean {
  const poll = state.poll
  if (!poll?.open) return false
  if (!send({ type: 'vote', pollId: poll.id, option })) return false
  state.vote = option // optimistic, now that it is on the wire; the ack confirms
  return true
}

function publishSync(channel: string, syncState: Record<string, unknown>) {
  if (!isPresenter.value) return false
  return send({ type: 'sync', channel, state: syncState })
}

function publishLiveSource(file: string, content: string) {
  if (!isPresenter.value) return false
  return send({ type: 'live-source', file, content })
}

function reset() {
  if (!isPresenter.value) return false
  return send({ type: 'reset' })
}

/** Subscribe to raw server messages (the sync bridge needs them as they arrive). */
function on(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useHub() {
  return hubApi
}

const hubApi = {
  state: readonly(state),
  isPresenter,
  connect,
  on,
  openPoll,
  closePoll,
  vote,
  publishSync,
  publishLiveSource,
  reset,
  hubUrl,
  joinUrl,
}

// For on-stage diagnostics from DevTools (window.__hub.state.audienceCount,
// window.__hub.reset()): always under `pnpm dev`, and on any deck the hub has
// accepted as presenter, so the hosted deck's presenter has it too. Every
// action it exposes is role-checked by the hub anyway.
if (typeof window !== 'undefined') {
  if (import.meta.env.DEV) (window as any).__hub = hubApi
  watch(isPresenter, (p) => {
    if (p) (window as any).__hub = hubApi
  })
}
