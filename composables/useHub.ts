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
 * Who it is: a presenter if a token is stored, else audience. The token is
 * never in the bundle. Open the deck once with `?presenter=TOKEN` and it is
 * kept in localStorage; `?presenter=` (empty) forgets it. Audience devices
 * share the same `hub:clientId` key as /join, so a phone that voted on the
 * join page and then follows the deck is still one voter.
 */
import { computed, reactive, readonly, shallowRef } from 'vue'
import {
  WS_PATH,
  type AudienceMessage,
  type ClientMessage,
  type Poll,
  type PollResult,
  type Role,
  type ServerMessage,
  type SyncState,
  type Tally,
} from '../server/protocol'

const CLIENT_ID_KEY = 'hub:clientId'
const TOKEN_KEY = 'hub:presenterToken'
const NAME_KEY = 'hub:name'

type Listener = (msg: ServerMessage) => void

const state = reactive({
  connected: false,
  /** What the server says we are, once it has answered `hello`. */
  role: 'audience' as Role,
  audienceCount: 0,
  poll: null as Poll | null,
  tally: null as Tally | null,
  result: null as PollResult | null,
  /** This device's vote on the current poll. */
  vote: null as number | null,
  messages: [] as AudienceMessage[],
  /** Latest Slidev shared state per channel, as published by the presenter. */
  sync: {} as Record<string, SyncState>,
  liveSource: {} as Record<string, string>,
  /** Server clock minus ours, for countdowns. */
  clockSkew: 0,
})

const listeners = new Set<Listener>()
const socket = shallowRef<WebSocket | null>(null)
let wanted = false
let backoff = 1000
let retryTimer = 0

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

/** `?presenter=TOKEN` stores the token; `?presenter=` forgets it. */
function presenterToken(): string | null {
  const s = storage()
  if (typeof window === 'undefined') return null
  const param = new URLSearchParams(window.location.search).get('presenter')
  if (param !== null) {
    if (param) s?.setItem(TOKEN_KEY, param)
    else s?.removeItem(TOKEN_KEY)
  }
  return s?.getItem(TOKEN_KEY) ?? null
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
    send({
      type: 'hello',
      role: token ? 'presenter' : 'audience',
      clientId: clientId(),
      name: storage()?.getItem(NAME_KEY) || undefined,
      token: token ?? undefined,
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

function disconnect() {
  wanted = false
  window.clearTimeout(retryTimer)
  socket.value?.close()
  socket.value = null
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
      state.poll = msg.poll
      state.tally = msg.tally
      state.result = msg.result
      state.vote = msg.vote
      state.audienceCount = msg.audienceCount
      state.sync = msg.sync
      state.liveSource = msg.liveSource
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
      state.sync = { ...state.sync, [msg.channel]: msg.state }
      break
    case 'live-source':
      state.liveSource = { ...state.liveSource, [msg.file]: msg.content }
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

function vote(option: number) {
  const poll = state.poll
  if (!poll?.open) return false
  state.vote = option // optimistic; the ack confirms
  return send({ type: 'vote', pollId: poll.id, option })
}

function publishSync(channel: string, syncState: SyncState) {
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
  return {
    state: readonly(state),
    isPresenter,
    connect,
    disconnect,
    send,
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
}
