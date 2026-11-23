/**
 * hubSync — lets the audience's copy of the deck follow the presenter.
 *
 * Slidev already keeps a shared state per window (slide, click, cursor, timer,
 * drawings) and syncs it between windows through a pluggable transport: the
 * dev server under `pnpm dev`, BroadcastChannel in a static build. This module
 * registers the hub as one more transport with `addSyncMethod`, so:
 *
 *   presenter's deck  --sync-->  hub  --sync-->  every phone following along
 *
 * Nothing in Slidev's navigation changes. The presenter's writes are forwarded
 * (throttled, since the presenter view publishes the cursor on every mouse
 * move); the viewer's incoming states are handed to Slidev's own `onUpdate`,
 * which routes to the slide. Viewers never send: Slidev only lets localhost
 * viewers write, and the hub only accepts `sync` from the presenter anyway.
 * Should Slidev register no channels in a window, position alone is bridged
 * through the router instead (see installHubSync).
 *
 * Follow mode (viewers only). On by default. While following, every presenter
 * move is applied at once. Navigating by hand unlocks: the presenter's position
 * keeps arriving but is held, and `follow()` jumps to it and resumes. The rule
 * for "by hand" is simple: a navigation that lands anywhere other than where
 * the presenter is must have been the viewer's.
 *
 * Live source. The demo edits level.ts and physics.ts through HMR on the
 * presenter's laptop, which a static build does not have. So the presenter
 * publishes the text of each file as it changes and viewers feed it into the
 * same refs LiveSource.vue reads, and the code animates on their phones too.
 * The game itself cannot follow (that needs module evaluation), so MarioGame
 * shows a note instead of a canvas while following.
 */
import { addSyncMethod } from '@slidev/client'
import { computed, ref, shallowRef, watch } from 'vue'
import { isLiveFile, LIVE_FILES, sourceOf } from '../demo/mario/liveSource'
import type { ServerMessage, SyncState } from '../server/protocol'
import { useHub } from './useHub'

/** The bits of vue-router this module touches, so it needs no import from a package pnpm hides. */
interface RouteLike {
  name?: string | symbol | null
  params: Record<string, string | string[]>
  query: Record<string, unknown>
}
export interface RouterLike {
  currentRoute: { value: RouteLike }
  afterEach: (fn: (to: RouteLike, from: RouteLike, failure?: unknown) => void) => void
  replace: (to: { path: string; query?: Record<string, unknown> }) => Promise<unknown>
}

/** Presenter writes are coalesced to this many ms; the cursor moves far more often. */
const SEND_EVERY_MS = 60

/** Slidev names its channels `<title> - shared` and `<title> - drawings`. */
const isNavChannel = (channel: string) => channel.endsWith(' - shared')

export interface NavPosition {
  page: number
  clicks: number
}

// --------------------------------------------------------------- viewer state

/** True when this deck is a viewer that can follow (connected to the hub as audience, on the play route). */
export const canFollow = ref(false)
/** On by default: every fresh load follows the presenter. */
export const following = ref(true)
/** Where the presenter is, as last heard. */
export const presenterNav = shallowRef<NavPosition | null>(null)

const channels = new Map<string, (data: Partial<SyncState>) => void>()
/** Slidev's live state object per channel, so a presenter can publish it on connect. */
const states = new Map<string, SyncState>()
const held = new Map<string, SyncState>()
let router: RouterLike | null = null

function navOf(state: SyncState): NavPosition | null {
  const page = Number(state.page)
  const clicks = Number(state.clicks ?? 0)
  return Number.isFinite(page) && page > 0 ? { page, clicks } : null
}

/** Page and clicks from a slide route (`/12` or `/presenter/12`, `?clicks=`); null elsewhere. */
function routeNav(route: RouteLike): NavPosition | null {
  if (route.name !== 'play' && route.name !== 'presenter') return null
  const no = Array.isArray(route.params.no) ? route.params.no[0] : route.params.no
  const page = Number(no)
  const clicks = Number(route.query.clicks ?? 0)
  return Number.isFinite(page) ? { page, clicks: Number.isFinite(clicks) ? clicks : 0 } : null
}

const same = (a: NavPosition | null, b: NavPosition | null) => !!a && !!b && a.page === b.page && a.clicks === b.clicks

function apply(channel: string, state: SyncState) {
  const onUpdate = channels.get(channel)
  if (onUpdate) {
    onUpdate(state)
    return
  }
  // Slidev has not registered this channel in this window (see the fallback
  // note in installHubSync). A following deck can still be moved by the router.
  if (isNavChannel(channel) && canFollow.value && router) {
    const nav = navOf(state)
    if (nav && !same(routeNav(router.currentRoute.value), nav)) {
      router.replace({ path: `/${nav.page}`, query: { ...router.currentRoute.value.query, clicks: nav.clicks } })
    }
  }
}

function receive(channel: string, state: SyncState) {
  held.set(channel, state)
  if (isNavChannel(channel)) {
    presenterNav.value = navOf(state)
    if (!following.value) return
  }
  apply(channel, state)
}

/** Catch up to the presenter and keep following. */
export function follow() {
  following.value = true
  const nav = presenterNav.value
  if (nav && router) {
    const route = router.currentRoute.value
    if (!same(routeNav(route), nav)) {
      router.replace({ path: `/${nav.page}`, query: { ...route.query, clicks: nav.clicks } })
    }
  }
  for (const [channel, state] of held) if (isNavChannel(channel)) apply(channel, state)
}

export function unlock() {
  following.value = false
}

// ---------------------------------------------------------------- presenter

const pending = new Map<string, SyncState>()
let sendTimer = 0

function flushSends(publish: (channel: string, state: SyncState) => void) {
  sendTimer = 0
  for (const [channel, state] of pending) {
    // Whatever window the presenter drives from, the room should treat it as
    // the presenter: viewers ignore updates stamped by another viewer.
    const lastUpdate = state.lastUpdate as { type?: string } | undefined
    publish(channel, lastUpdate ? { ...state, lastUpdate: { ...lastUpdate, type: 'presenter' } } : state)
  }
  pending.clear()
}

// ------------------------------------------------------------------ install

let installed = false

// For on-stage diagnostics from DevTools.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as any).__hubSync = { channels, states, held, following, presenterNav, canFollow, follow, unlock }
}

/** Is this window the live deck: a slide route, not print or export? Overview, entry and notes are not. */
function isLiveRoute(route: RouteLike): boolean {
  return (route.name === 'play' || route.name === 'presenter') && !('print' in route.query)
}

/** Slidev names the position channel after the deck title, which it also puts in the document title. */
function navChannelKey(): string {
  for (const key of channels.keys()) if (isNavChannel(key)) return key
  return `${document.title} - shared`
}

/**
 * Called once from setup/main.ts, before the router has resolved anything.
 *
 * Nothing here waits on the router. The transport is registered with Slidev
 * right away, so its channels are captured whether Slidev sets them up before
 * or after this runs; the hub is connected as soon as the window is on a slide
 * route, and a window that starts on /overview or /entry joins when it
 * navigates into the deck. (An earlier version checked the route once, after
 * `isReady()`, and returned; a window that started anywhere else never
 * bridged, however far it went afterwards.)
 *
 * Fallback. If Slidev registers no channels in this window, position is still
 * bridged through the router: the presenter publishes page and clicks from
 * `afterEach`, and `apply` navigates a viewer that has no channel handler.
 * Cursor and drawings need the channels and are simply not bridged then.
 */
export function installHubSync(r: RouterLike) {
  if (installed || typeof window === 'undefined') return
  installed = true
  router = r

  const hub = useHub()

  // Presenter -> hub. Slidev calls `write` on every change of a channel's state.
  addSyncMethod({
    init(channelKey, onUpdate, state) {
      channels.set(channelKey, onUpdate as (data: Partial<SyncState>) => void)
      states.set(channelKey, state as SyncState)
      // A snapshot may have arrived before Slidev set this channel up.
      const heldState = held.get(channelKey)
      if (heldState && (!isNavChannel(channelKey) || following.value)) onUpdate(heldState)
      return (state, updating) => {
        if (updating || !hub.isPresenter.value) return
        pending.set(channelKey, state as SyncState)
        if (!sendTimer) sendTimer = window.setTimeout(() => flushSends(hub.publishSync), SEND_EVERY_MS)
      }
    },
  })

  /** Where the presenter is: Slidev's channel states, or, with none registered, page and clicks from the route. */
  function publishPosition() {
    if (states.size) {
      for (const [channel, state] of states) pending.set(channel, state)
    } else {
      const nav = routeNav(r.currentRoute.value)
      if (nav) pending.set(navChannelKey(), { ...nav, lastUpdate: { id: 'route', type: 'presenter', time: Date.now() } })
    }
    if (pending.size && !sendTimer) sendTimer = window.setTimeout(() => flushSends(hub.publishSync), SEND_EVERY_MS)
  }

  /** Everything the hub should hold: the live demo's source and where the presenter is. */
  function publishAll() {
    for (const file of LIVE_FILES) hub.publishLiveSource(file, sourceOf(file).value)
    publishPosition()
  }

  // Hub -> viewer. Listening before connecting, so the first snapshot is never missed.
  hub.on((msg: ServerMessage) => {
    if (msg.type === 'state' && msg.you.role === 'presenter') {
      // A fresh snapshot means the hub's copy may be empty (connect, reconnect,
      // reset): publish, so the room is not left on a position from the last rehearsal.
      publishAll()
      return
    }
    if (hub.state.role === 'presenter' || hub.state.presenterRejected) return
    switch (msg.type) {
      case 'state':
        for (const [channel, state] of Object.entries(msg.sync)) receive(channel, state)
        for (const [file, content] of Object.entries(msg.liveSource)) if (isLiveFile(file)) sourceOf(file).value = content
        break
      case 'sync':
        receive(msg.channel, msg.state)
        break
      case 'live-source':
        if (isLiveFile(msg.file)) sourceOf(msg.file).value = msg.content
        break
    }
  })

  // Connect once the window is on a slide route. A component (the QR slide, the
  // game) may have connected first; then the snapshot has already come and gone,
  // and a presenter publishes now instead.
  const live = computed(() => isLiveRoute(r.currentRoute.value))
  watch(
    live,
    (on) => {
      if (!on) return
      if (hub.isPresenter.value) publishAll()
      else hub.connect()
    },
    { immediate: true },
  )

  // A deck whose presenter token was rejected is audience by the hub's rules,
  // but it is the lecturer's screen: it must not be steered by stale sync.
  // Synchronous, so `canFollow` is right by the time a snapshot is applied.
  const isViewer = computed(() => hub.state.connected && hub.state.role === 'audience' && !hub.state.presenterRejected)
  watch(
    [isViewer, () => r.currentRoute.value.name],
    ([viewer, route]) => {
      canFollow.value = viewer && route === 'play'
      // Styling hook: a following deck hides Slidev's toolbar (styles/index.css).
      document.documentElement.classList.toggle('hub-viewer', canFollow.value)
    },
    { immediate: true, flush: 'sync' },
  )

  r.afterEach((to, _from, failure) => {
    if (failure) return
    // Presenter without Slidev channels: position comes from the route (the fallback above).
    if (hub.isPresenter.value && !states.size && live.value) publishPosition()
    // Viewer: a navigation that lands away from the presenter was the viewer's own.
    // A cancelled or redirected one landed nowhere and says nothing.
    if (!canFollow.value || !following.value || !presenterNav.value) return
    const nav = routeNav(to)
    if (nav && !same(nav, presenterNav.value)) following.value = false
  })

  // Presenter -> hub: the live demo's source as it changes (a save on the laptop).
  for (const file of LIVE_FILES) {
    watch(sourceOf(file), (content) => hub.publishLiveSource(file, content))
  }

  // Said once, on stage, if it ever happens again: the room cannot follow cursor
  // or drawings from this window, and position is going through the fallback.
  if (import.meta.env.DEV) {
    window.setTimeout(() => {
      if (live.value && !channels.size) console.warn('[hub] Slidev registered no sync channels in this window; position is bridged through the router, cursor and drawings are not.')
    }, 10_000)
  }
}
