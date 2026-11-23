<script setup lang="ts">
/**
 * GymGame — the finale: the duck walks Harvard Yard and challenges the
 * Science Center Gym, where the room answers for it.
 *
 *   Overworld   left stick / D-pad / arrows to walk, ✕ / Space to talk.
 *               Walking into the Gym door reads the sign; ✕ challenges.
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
import { useIsSlideActive } from '@slidev/client'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHub } from '../composables/useHub'
import { canFollow, following } from '../composables/hubSync'
import { useLive } from '../composables/useLive'
import { Controller } from '../demo/mario/controller'
import { Battle, MAX_HP, pollIdFor, type BattleState } from '../demo/gym/battle'
import { Overworld, type OverworldState } from '../demo/gym/overworld'
import { VIEW_H, VIEW_W, drawBattle, drawOverworld, type BattleScene } from '../demo/gym/render'
import { SLOPWHALE_NAME } from '../demo/gym/slopwhale'
import DuckSprite from './viz/DuckSprite.vue'

const props = withDefaults(defineProps<{ seconds?: number }>(), { seconds: 20 })

const live = useLive()
const isActive = useIsSlideActive()
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
const fx: BattleScene = { clock: 0, monsterHurt: 0, duckHurt: 0, monsterGone: false, duckGone: false }
const shake = ref(false)

/** Answer picked with the controller when there is no hub (or no votes). */
const localPick = ref(0)
const localMode = ref(false)
/** When the hub poll for the current round was opened; guards double-apply. */
let appliedPoll = ''

world.onGym = () => {
  battle.start()
  scene.value = 'battle'
  fx.clock = 0
  fx.monsterGone = fx.duckGone = false
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
const result = computed(() => (hub.state.result?.pollId === pollId.value ? hub.state.result : null))
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
  if (battle.state.last?.correct) fx.monsterHurt = 40
  else {
    fx.duckHurt = 40
    shake.value = true
    setTimeout(() => (shake.value = false), 500)
  }
  localMode.value = false
  sync()
}

watch(result, (r) => {
  if (!r || !hubReady.value || battle.state.phase !== 'question') return
  if (appliedPoll === r.pollId) return
  appliedPoll = r.pollId
  // Nobody voted: the hub names option 0 by rule; that is not an answer. Fall back to the controller.
  if (r.total === 0) {
    localMode.value = true
    return
  }
  resolve(r.winner, r.total)
})

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
    world.tick({ dx: Math.round(input.moveX), dy: Math.round(input.moveY), interact: input.actionPressed })
    ow.value = world.state
    return
  }

  // battle
  fx.clock++
  if (fx.monsterHurt > 0) fx.monsterHurt--
  if (fx.duckHurt > 0) fx.duckHurt--
  const phase = battle.state.phase

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

  if (input.actionPressed) {
    if (phase === 'won' || phase === 'lost') {
      // ✕ after the end: back to the Yard, standing at the door.
      scene.value = 'yard'
      world.reset()
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
  if (scene.value === 'yard') drawOverworld(ctx, world.state)
  else drawBattle(ctx, fx)
}

function start() {
  if (!live || !canvas.value || mirroring.value) return
  stop()
  hub.connect()
  canvas.value.width = VIEW_W
  canvas.value.height = VIEW_H
  controller.attachKeyboard(canvas.value)
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
  <div class="gym">
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
      <div v-else-if="scene === 'yard' && !focused" class="hint">Click, then walk with the arrows or the controller. ✕ talks.</div>

      <!-- Battle: HP, dialogue, question -->
      <template v-if="scene === 'battle'">
        <div class="hp monster">
          <div class="name">{{ SLOPWHALE_NAME }} <span class="lv">Lv. 50</span></div>
          <div class="bar"><i :class="hpClass(bs.monsterHp)" :style="{ width: `${(100 * bs.monsterHp) / MAX_HP}%` }" /></div>
        </div>
        <div class="hp duck">
          <div class="name">CS50 Duck <span class="lv">Lv. 10</span></div>
          <div class="bar"><i :class="hpClass(bs.duckHp)" :style="{ width: `${(100 * bs.duckHp) / MAX_HP}%` }" /></div>
          <div class="num">{{ bs.duckHp }} / {{ MAX_HP }}</div>
        </div>

        <div v-if="bs.phase === 'question' && bs.round" class="box question">
          <div class="q-head">
            <span class="q-concepts">{{ concepts }}</span>
            <span v-if="secondsLeft !== null" class="q-clock" :class="{ late: secondsLeft <= 5 }">{{ secondsLeft }}s</span>
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

        <div v-else class="box dialogue battle-line" :class="{ good: bs.last?.correct && bs.phase === 'resolve', bad: bs.last && !bs.last.correct && bs.phase === 'resolve' }">
          <div class="text">{{ line }}</div>
          <div v-if="revealed && bs.round" class="answer">
            Answer: <b>{{ String.fromCharCode(65 + bs.round.correct) }}</b> · {{ bs.round.options[bs.round.correct] }}
            <span v-if="bs.last && bs.last.total" class="muted"> · the room: {{ String.fromCharCode(65 + bs.last.winner) }}, {{ bs.last.total }} votes</span>
          </div>
          <div class="more">✕</div>
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
.gym-frame {
  position: relative;
  aspect-ratio: 3 / 2;
  height: 100%;
  max-width: 100%;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  overflow: hidden;
  background: #fff;
  line-height: 0;
}
.gym-frame.focused {
  border-color: #a51c30;
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.15);
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
  bottom: 6%;
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
  padding: 0.45rem 0.9rem 0.5rem;
  border: 3px solid #212529;
  border-radius: 8px;
  box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #adb5bd;
  background: #fff;
  line-height: 1.35;
  font-size: 0.92rem;
  color: #212529;
}
.dialogue .speaker {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #a51c30;
  font-weight: 700;
  margin-bottom: 0.15rem;
}
.dialogue .text {
  font-weight: 700;
  min-height: 2.6em;
}
.dialogue .more {
  position: absolute;
  right: 0.8rem;
  bottom: 0.4rem;
  font-size: 0.8rem;
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
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #495057;
}
.muted {
  color: #6c757d;
}

/* HP */
.hp {
  position: absolute;
  width: 38%;
  padding: 0.35rem 0.6rem;
  border: 2px solid #212529;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.95);
  line-height: 1.3;
  font-size: 0.8rem;
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
  height: 8px;
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
  font-size: 0.66rem;
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
  font-size: 0.86rem;
  margin-bottom: 0.25rem;
}
.q-options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.15rem 0.8rem;
  font-size: 0.74rem;
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
