<script setup lang="ts">
/**
 * GymGame — the finale: the duck walks Harvard Yard and challenges the
 * Science Center Gym, where the room answers for it.
 *
 *   Overworld   left stick / D-pad / arrows to walk, ✕ / Space to talk.
 *               Walking into the Science Center's doors goes inside; the mat
 *               by the door leads back out. Talking to the Gym Leader, Henry
 *               Leitner, starts the battle.
 *   Battle      ✕ moves the text on. When a question opens, the presenter's
 *               deck opens a timed `choice` poll on the hub (phones on /join
 *               and decks that follow get the buttons for free). The hub's
 *               winner decides the round.
 *   Fallback    no hub, or a round that closes with no votes: ↑ ↓ pick an
 *               answer on screen, ✕ locks it. ✕ while a hub poll is open
 *               closes it early.
 *
 * Runs only while its slide is active in a live view (useLive). A deck that
 * is following the presenter shows a note instead of a second game, like
 * MarioGame; its owner votes through the AudienceChoice overlay.
 */
import { useIsSlideActive, useNav } from '@slidev/client'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHub } from '../composables/useHub'
import { canFollow, following } from '../composables/hubSync'
import { useLive } from '../composables/useLive'
import { Controller } from '../demo/mario/controller'
import { Battle, MAX_HP, pollIdFor, type BattleState } from '../demo/gym/battle'
import { Overworld, type OverworldState } from '../demo/gym/overworld'
import { BEFORE_LEADER } from '../demo/gym/areas'
import { AFTER_LOSS, AFTER_WIN } from '../demo/gym/npcs'
import { TRANSITION_FRAMES, VIEW_H, VIEW_W, drawBattle, drawFade, drawOverworld, drawTransition, freshScene, type BattleScene } from '../demo/gym/render'
import { SLOPPYCLAUDE_NAME } from '../demo/gym/sloppyclaude'
import DuckSprite from './viz/DuckSprite.vue'

const props = withDefaults(defineProps<{ seconds?: number; full?: boolean }>(), { seconds: 20, full: false })

const live = useLive()
const isActive = useIsSlideActive()
const nav = useNav()
const hub = useHub()
const mirroring = computed(() => canFollow.value && following.value)

const canvas = ref<HTMLCanvasElement | null>(null)
const focused = ref(false)

// ------------------------------------------------------------------ game

type Scene = 'yard' | 'battle'
const scene = ref<Scene>('yard')
const world = new Overworld()
const battle = new Battle()
const controller = new Controller()

const ow = ref<OverworldState>(world.state)
const bs = ref<BattleState>(battle.state)
const line = ref('')
let fx: BattleScene = freshScene()
const shake = ref(false)
/** Frames into the flash-and-wipe that leads into a battle; -1 when not transitioning. */
let transition = -1
/** True while an intro animation (ball, burst, hop) is playing; ✕ waits for it. */
const animating = ref(false)
/** Frames into the fade that ends the game; -1 otherwise. When it completes, the deck moves on. */
let ending = -1
const ENDING_FRAMES = 75
/** Reactive mirror of the bits of fx the template needs. */
const monsterOut = ref(false)

/** Answer picked with the controller when there is no hub (or no votes). */
const localPick = ref(0)
const localMode = ref(false)
/** When the hub poll for the current round was opened; guards double-apply. */
let appliedPoll = ''

world.onBattle = () => {
  // The Yard stays on screen under the flash and the wipe; then the battle opens.
  transition = 0
}

function beginBattle() {
  transition = -1
  battle.start()
  scene.value = 'battle'
  fx = freshScene()
  monsterOut.value = false
  sync()
}

function sync() {
  ow.value = world.state
  bs.value = { ...battle.state }
  line.value = scene.value === 'battle' ? battle.line() : ''
}

// ------------------------------------------------------------------- hub

// From the reactive snapshot, not the Battle object, or Vue would cache it once.
const pollId = computed(() => pollIdFor(bs.value))
const poll = computed(() => (hub.state.poll?.id === pollId.value ? hub.state.poll : null))
const pollOpen = computed(() => !!poll.value?.open)
const tally = computed(() => (hub.state.tally?.pollId === pollId.value ? hub.state.tally : null))
const hubReady = computed(() => live && hub.state.connected && hub.isPresenter.value)

function openQuestion() {
  const r = battle.state.round
  if (!r) return
  localPick.value = 0
  if (hubReady.value) {
    localMode.value = false
    hub.openPoll({ id: battle.pollId(), kind: 'choice', question: r.question, options: r.options, durationMs: props.seconds * 1000 })
  } else {
    localMode.value = true
  }
}

function resolve(winner: number, total: number) {
  const r = battle.state.round
  if (!r || battle.state.phase !== 'question') return
  battle.pollClosed(winner, total)
  if (battle.state.last?.correct) {
    fx.monsterHurt = 40
    fx.duckCheer = 36
  } else {
    fx.duckHurt = 40
    shake.value = true
    setTimeout(() => (shake.value = false), 500)
  }
  localMode.value = false
  sync()
}

/**
 * A round is decided only by a verdict that arrives live (`poll:result` on the
 * socket), never by the snapshot a reconnect or reload brings, which may
 * describe a vote that closed long ago. Same rule as GameChoice.
 */
let offResult: (() => void) | null = null
function listenForResults() {
  offResult?.()
  offResult = hub.on((msg) => {
    if (msg.type !== 'poll:result' || !hubReady.value || battle.state.phase !== 'question') return
    if (msg.pollId !== pollIdFor(battle.state)) return
    if (appliedPoll === msg.pollId) return
    appliedPoll = msg.pollId
    // Nobody voted: the hub names option 0 by rule; that is not an answer. Fall back to the controller.
    if (msg.total === 0) {
      localMode.value = true
      return
    }
    resolve(msg.winner, msg.total)
  })
}

// countdown
const now = ref(Date.now())
let ticker = 0
watch(
  pollOpen,
  (o) => {
    clearInterval(ticker)
    if (o) ticker = window.setInterval(() => (now.value = Date.now()), 200)
  },
  { immediate: true },
)
const secondsLeft = computed(() => {
  const closesAt = poll.value?.closesAt
  if (!pollOpen.value || !closesAt) return null
  return Math.max(0, Math.ceil((closesAt - (now.value + hub.state.clockSkew)) / 1000))
})

const rows = computed(() => {
  const r = bs.value.round
  if (!r) return []
  const t = tally.value
  const total = t?.total ?? 0
  return r.options.map((label, i) => ({
    i,
    label,
    n: t?.counts[i] ?? 0,
    pct: total ? (100 * (t?.counts[i] ?? 0)) / total : 0,
    correct: i === r.correct,
  }))
})
const showCounts = computed(() => !!tally.value && (hub.isPresenter.value || !pollOpen.value))
const revealed = computed(() => bs.value.phase === 'resolve' || bs.value.phase === 'explain')

// ------------------------------------------------------------------- loop

let raf = 0
let last = 0
let acc = 0
const STEP = 1000 / 60
let prevMoveY = 0

function step() {
  const input = controller.poll()
  if (scene.value === 'yard') {
    if (transition >= 0 || ending >= 0) return // hold still under the flash, and under the fade
    world.tick({ dx: Math.round(input.moveX), dy: Math.round(input.moveY), interact: input.actionPressed })
    ow.value = world.state
    if (world.state.mode.kind === 'done') ending = 0
    return
  }

  // battle
  fx.clock++
  if (fx.monsterHurt > 0) fx.monsterHurt--
  if (fx.duckHurt > 0) fx.duckHurt--
  if (fx.duckCheer > 0) fx.duckCheer--
  if (fx.slideIn < 1) fx.slideIn = Math.min(1, fx.slideIn + 1 / 24)
  const phase = battle.state.phase

  // Intro choreography. Each runs once its phase begins; ✕ waits for it.
  if (phase === 'sendout') {
    if (fx.ball < 0) fx.ball = 0
    if (fx.ball < 1) {
      fx.ball = Math.min(1, fx.ball + 1 / 40)
      fx.leader = Math.min(1, fx.leader + 1 / 40)
      if (fx.ball === 1) fx.burst = 12
    } else if (fx.burst > 0) {
      fx.burst--
      fx.monster = Math.min(1, fx.monster + 1 / 12)
    } else fx.monster = 1
    animating.value = fx.monster < 1 || fx.burst > 0
    monsterOut.value = fx.monster >= 1
  } else if (phase === 'duckin') {
    if (fx.duckIn < 0) fx.duckIn = 0
    if (fx.duckIn < 1) fx.duckIn = Math.min(1, fx.duckIn + 1 / 36)
    animating.value = fx.duckIn < 1
  } else animating.value = false

  if (phase === 'question') {
    // ↑ ↓ as edges, for the local pick
    const my = Math.round(input.moveY)
    if (localMode.value && my !== 0 && prevMoveY === 0) {
      const n = battle.state.round!.options.length
      localPick.value = (localPick.value + my + n) % n
    }
    prevMoveY = my
    if (input.actionPressed) {
      if (localMode.value) resolve(localPick.value, 0)
      else if (pollOpen.value) hub.closePoll(battle.pollId()) // early close; the hub still names the winner
    }
    return
  }

  if (input.actionPressed && !animating.value && fx.slideIn >= 1) {
    if (phase === 'won' || phase === 'lost') {
      // ✕ after the end: back into the Gym, in front of Henry, who has something to say.
      // After a win, David then walks over for the last word and the deck moves on.
      scene.value = 'yard'
      world.enter('gym', BEFORE_LEADER)
      world.say('leitner', phase === 'won' ? AFTER_WIN : AFTER_LOSS, phase === 'won' ? 'closing' : undefined)
      sync()
      return
    }
    const opened = battle.advance()
    if (battle.state.phase === 'won') fx.monsterGone = true
    if (battle.state.phase === 'lost') fx.duckGone = true
    sync()
    if (opened) openQuestion()
  }
}

function frame(t: number) {
  raf = requestAnimationFrame(frame)
  let delta = t - last
  last = t
  if (delta > 250) delta = 250
  acc += delta
  while (acc >= STEP) {
    step()
    acc -= STEP
  }
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  if (scene.value === 'yard') {
    drawOverworld(ctx, world.state)
    if (transition >= 0) {
      drawTransition(ctx, transition)
      transition++
      if (transition >= TRANSITION_FRAMES) beginBattle()
    }
    if (ending >= 0) {
      drawFade(ctx, ending / ENDING_FRAMES)
      ending++
      if (ending === ENDING_FRAMES) {
        // The story is told: on to the last slide. The game stops with the slide.
        if (live) nav.next()
      }
    }
  } else drawBattle(ctx, fx)
}

function start() {
  if (!live || !canvas.value || mirroring.value) return
  stop()
  hub.connect()
  canvas.value.width = VIEW_W
  canvas.value.height = VIEW_H
  controller.attachKeyboard(canvas.value)
  listenForResults()
  ending = -1
  transition = -1
  last = performance.now()
  acc = 0
  raf = requestAnimationFrame(frame)
  sync()
  if (import.meta.env.DEV) (window as any).__gym = { world, battle, controller }
}

function stop() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
  controller.detachKeyboard()
  offResult?.()
  offResult = null
  clearInterval(ticker)
  if (import.meta.env.DEV) delete (window as any).__gym
}

onMounted(() => isActive.value && start())
watch(isActive, (a) => (a ? start() : stop()))
watch(mirroring, (m) => (m ? stop() : isActive.value && start()))
onBeforeUnmount(stop)

const hpClass = (hp: number) => (hp > 50 ? 'ok' : hp > 25 ? 'mid' : 'low')
const concepts = computed(() => bs.value.round?.concepts.join(' · ') ?? '')
</script>

<template>
  <div class="gym" :class="{ full }">
    <div v-if="mirroring" class="gym-mirror">
      <DuckSprite :size="48" />
      <div>
        <b>The game is on the presenter's screen.</b>
        <div>When the Gym Leader asks a question, the answer buttons appear here. Your vote counts.</div>
      </div>
    </div>

    <div v-else class="gym-frame" :class="{ focused, shake }">
      <canvas ref="canvas" tabindex="0" class="gym-canvas" @click="canvas?.focus()" @focus="focused = true" @blur="focused = false" />

      <!-- Yard: dialogue -->
      <div v-if="scene === 'yard' && ow.mode.kind === 'talk'" class="box dialogue">
        <div class="speaker">{{ ow.mode.speaker }}</div>
        <div class="text">{{ ow.mode.lines[ow.mode.index] }}</div>
        <div class="more">✕</div>
      </div>
      <div v-else-if="scene === 'yard' && ow.area === 'yard' && ow.mode.kind === 'walk' && !focused && ow.sinceEnter > 60" class="hint">Click, then walk with the arrows or the controller. ✕ talks.</div>

      <!-- Battle: HP, dialogue, question -->
      <template v-if="scene === 'battle'">
        <div v-if="monsterOut && bs.phase !== 'intro'" class="hp monster">
          <div class="name">{{ SLOPPYCLAUDE_NAME }} <span class="lv">Lv. 50</span></div>
          <div class="bar"><i :class="hpClass(bs.monsterHp)" :style="{ width: `${(100 * bs.monsterHp) / MAX_HP}%` }" /></div>
        </div>
        <div v-if="bs.phase !== 'intro' && bs.phase !== 'sendout' && bs.phase !== 'duckin'" class="hp duck">
          <div class="name">CS50 Duck <span class="lv">Lv. 10</span></div>
          <div class="bar"><i :class="hpClass(bs.duckHp)" :style="{ width: `${(100 * bs.duckHp) / MAX_HP}%` }" /></div>
          <div class="num">{{ bs.duckHp }} / {{ MAX_HP }}</div>
        </div>

        <div v-if="bs.phase === 'question' && bs.round" class="box question">
          <div class="q-head">
            <span class="q-concepts">{{ concepts }}</span>
            <span v-if="secondsLeft !== null" class="q-clock" :class="{ late: secondsLeft <= 5 }">{{ secondsLeft }}s</span>
            <span v-else-if="localMode && hub.state.presenterRejected" class="q-local">presenter token rejected · ↑↓ then ✕</span>
            <span v-else-if="localMode" class="q-local">no room connected · ↑↓ then ✕</span>
            <span v-else class="q-room"><b>{{ hub.state.audienceCount }}</b> in the room</span>
          </div>
          <div class="q-text">{{ bs.round.question }}</div>
          <ol class="q-options">
            <li v-for="r in rows" :key="r.i" :class="{ picked: localMode && localPick === r.i }">
              <span class="key">{{ String.fromCharCode(65 + r.i) }}</span>
              <span class="label">{{ r.label }}</span>
              <span v-if="showCounts" class="n">{{ r.n }}</span>
              <span class="tally"><i :style="{ width: showCounts ? `${r.pct}%` : '0%' }" /></span>
            </li>
          </ol>
        </div>

        <div v-if="bs.phase === 'won'" class="badge" aria-label="AI Slop Defender badge">
          <div class="badge-shield">
            <DuckSprite :size="54" />
          </div>
          <div class="badge-ribbon">AI SLOP DEFENDER</div>
        </div>

        <div v-if="bs.phase !== 'question'" class="box dialogue battle-line" :class="{ good: bs.last?.correct && bs.phase === 'resolve', bad: bs.last && !bs.last.correct && bs.phase === 'resolve' }">
          <div class="text">{{ line }}</div>
          <div v-if="revealed && bs.round" class="answer">
            Answer: <b>{{ String.fromCharCode(65 + bs.round.correct) }}</b> · {{ bs.round.options[bs.round.correct] }}
            <span v-if="bs.last && bs.last.total" class="muted"> · the room: {{ String.fromCharCode(65 + bs.last.winner) }}, {{ bs.last.total }} votes</span>
          </div>
          <div v-if="!animating" class="more">✕</div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.gym {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* The whole slide, on a dark surround like a handheld's bezel. */
.gym.full {
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  background: #182028;
}
.gym-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  height: 100%;
  max-width: 100%;
  overflow: hidden;
  background: #fff;
  line-height: 0;
}
.gym-frame.focused {
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.5);
}
.gym-frame.shake {
  animation: shake 400ms ease;
}
@keyframes shake {
  20% {
    transform: translate(-6px, 2px);
  }
  40% {
    transform: translate(6px, -2px);
  }
  60% {
    transform: translate(-4px, 1px);
  }
  80% {
    transform: translate(4px, -1px);
  }
}
.gym-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  outline: none;
  cursor: pointer;
}
.hint {
  position: absolute;
  left: 50%;
  bottom: 1.5%;
  transform: translateX(-50%);
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #dee2e6;
  font-size: 0.72rem;
  line-height: 1.3;
  color: #6c757d;
}

/* dialogue / question boxes: Pokémon-style frame */
.box {
  position: absolute;
  left: 2%;
  right: 2%;
  bottom: 2.5%;
  padding: 0.7rem 1.2rem 0.8rem;
  border: 4px solid #212529;
  border-radius: 10px;
  box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 6px #adb5bd;
  background: #fff;
  line-height: 1.35;
  font-size: 1.25rem;
  color: #212529;
}
.dialogue .speaker {
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #a51c30;
  font-weight: 700;
  margin-bottom: 0.15rem;
}
.dialogue .text {
  font-weight: 700;
  min-height: 2.7em;
}
.dialogue .more {
  position: absolute;
  right: 1rem;
  bottom: 0.5rem;
  font-size: 1rem;
  color: #a51c30;
  animation: blink 1s steps(1) infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.battle-line.good {
  border-color: #198754;
}
.battle-line.bad {
  border-color: #a51c30;
}
.answer {
  margin-top: 0.35rem;
  font-size: 0.95rem;
  font-weight: 400;
  color: #495057;
}
.muted {
  color: #6c757d;
}

/* HP */
.hp {
  position: absolute;
  width: 38%;
  padding: 0.45rem 0.8rem;
  border: 3px solid #212529;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  line-height: 1.3;
  font-size: 1rem;
}
.hp.monster {
  left: 3%;
  top: 4%;
}
.hp.duck {
  right: 3%;
  top: 40%;
}
.hp .name {
  font-weight: 700;
  display: flex;
  justify-content: space-between;
}
.hp .lv {
  font-weight: 400;
  color: #6c757d;
  font-size: 0.72rem;
}
.hp .bar {
  height: 10px;
  margin-top: 0.25rem;
  border-radius: 4px;
  background: #e9ecef;
  overflow: hidden;
}
.hp .bar i {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 500ms ease, background 300ms;
}
.hp .bar i.ok {
  background: #198754;
}
.hp .bar i.mid {
  background: #e69f00;
}
.hp .bar i.low {
  background: #a51c30;
}
.hp .num {
  text-align: right;
  font-size: 0.7rem;
  color: #6c757d;
  margin-top: 0.1rem;
}

/* question */
.question {
  bottom: 2.5%;
  top: auto;
}
.q-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.15rem;
}
.q-concepts {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: #a51c30;
}
.q-clock {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #212529;
}
.q-clock.late {
  color: #a51c30;
}
.q-local {
  color: #a51c30;
}
.q-text {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
}
.q-options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem 1rem;
  font-size: 0.95rem;
  line-height: 1.25;
}
.q-options li {
  position: relative;
  display: grid;
  grid-template-columns: 1.1rem 1fr auto;
  align-items: center;
  gap: 0.35rem;
  padding: 0.12rem 0.35rem 0.22rem;
  border-radius: 4px;
}
.q-options li.picked {
  background: rgba(165, 28, 48, 0.08);
  outline: 2px solid #a51c30;
}
.q-options .key {
  font-weight: 700;
  color: #a51c30;
}
.q-options .n {
  font-variant-numeric: tabular-nums;
  color: #6c757d;
  font-size: 0.72rem;
}
.q-options .tally {
  grid-column: 1 / -1;
  display: block;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}
.q-options .tally i {
  display: block;
  height: 100%;
  background: #a51c30;
  transition: width 300ms ease;
}

/* the badge */
.badge {
  position: absolute;
  left: 30%;
  top: 32%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: badge-in 700ms cubic-bezier(0.2, 1.4, 0.4, 1) both;
  filter: drop-shadow(0 6px 14px rgba(24, 32, 40, 0.3));
}
@keyframes badge-in {
  from {
    transform: translate(-50%, -50%) scale(0.2) rotate(-20deg);
    opacity: 0;
  }
}
.badge-shield {
  width: 7.5rem;
  height: 8.5rem;
  display: grid;
  place-items: center;
  background: #a51c30;
  clip-path: polygon(50% 0, 100% 12%, 100% 55%, 50% 100%, 0 55%, 0 12%);
  box-shadow: inset 0 0 0 6px #e0b040;
}
.badge-shield :deep(svg) {
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.35));
}
.badge-ribbon {
  position: relative;
  z-index: 1;
  margin-top: -1.4rem;
  padding: 0.3rem 1rem;
  background: #e0b040;
  color: #182028;
  border: 3px solid #182028;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 0.14em;
  font-size: 0.95rem;
  white-space: nowrap;
}

/* a following viewer */
.gym-mirror {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.4rem;
  border: 1px dashed #dee2e6;
  border-radius: 8px;
  max-width: 34rem;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #495057;
}
</style>
