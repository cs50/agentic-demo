<script setup lang="ts">
/**
 * GameChoice — "the room decides": a timed vote whose winner is written into
 * the running game.
 *
 * One press (useVizSteps) opens a `choice` poll on the hub with a countdown.
 * Phones get big buttons (join page, or the AudienceChoice overlay on a deck
 * that is following). When the hub closes the vote it names a winner, and the
 * presenter's deck writes that option's preset over level.ts or physics.ts
 * through the dev server, exactly as the editor and the agent do, so the game
 * beside this panel changes under the duck.
 *
 * Choices name presets from demo/mario/presets/ (see presets.ts). The vote is
 * tallied by the hub; this panel only shows it, so a reloaded tab or the
 * presenter view draws the same thing.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHub } from '../composables/useHub'
import { useLive } from '../composables/useLive'
import { useVizSteps } from '../composables/useVizSteps'
import { applyPreset, targetOf } from '../demo/mario/presets'

export interface Choice {
  label: string
  /** A file stem from demo/mario/presets/, e.g. `physics-moon`. */
  preset: string
}

const props = withDefaults(
  defineProps<{
    /** Stable across reloads; the hub dedupes by it. */
    id: string
    question: string
    choices: Choice[]
    /** How long the room has, once opened. */
    seconds?: number
  }>(),
  { seconds: 20 },
)

const hub = useHub()
const live = useLive()
const { step } = useVizSteps(1)

onMounted(() => live && hub.connect())

watch(step, (now, before) => {
  if (!live || !hub.isPresenter.value) return
  if (now === 1 && before === 0) {
    hub.openPoll({
      id: props.id,
      kind: 'choice',
      question: props.question,
      options: props.choices.map((c) => c.label),
      durationMs: props.seconds * 1000,
    })
  }
})

const poll = computed(() => (hub.state.poll?.id === props.id ? hub.state.poll : null))
const open = computed(() => !!poll.value?.open)
const tally = computed(() => (hub.state.tally?.pollId === props.id ? hub.state.tally : null))
const result = computed(() => (hub.state.result?.pollId === props.id ? hub.state.result : null))
const total = computed(() => tally.value?.total ?? 0)

// ------------------------------------------------------------- countdown

const now = ref(Date.now())
let ticker = 0
watch(
  open,
  (o) => {
    clearInterval(ticker)
    if (o) ticker = window.setInterval(() => (now.value = Date.now()), 200)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(ticker))

const secondsLeft = computed(() => {
  const closesAt = poll.value?.closesAt
  if (!open.value || !closesAt) return null
  return Math.max(0, Math.ceil((closesAt - (now.value + hub.state.clockSkew)) / 1000))
})

// --------------------------------------------------------------- applying

type Applied = { preset: string; file: string | null; ok: boolean; error?: string }
const applied = ref<Applied | null>(null)
let appliedClose = 0

/**
 * The winner is written only when the verdict arrives live, never from the
 * snapshot a reconnect or reload brings: a snapshot may describe a vote that
 * closed minutes ago, and writing it then would clobber whatever the lecturer
 * has edited since. If the deck was away when the vote closed, the panel says
 * so and the presenter asks again.
 */
onMounted(() => {
  if (!live) return
  const off = hub.on((msg) => {
    if (msg.type !== 'poll:result' || msg.pollId !== props.id || !hub.isPresenter.value) return
    void applyWinner(msg.winner)
  })
  onBeforeUnmount(off)
})

async function applyWinner(winner: number) {
  // Both presenter windows hear the same result; one write per close is enough.
  const closedAt = poll.value?.closesAt ?? 0
  if (closedAt && closedAt === appliedClose) return
  appliedClose = closedAt
  const choice = props.choices[winner]
  if (!choice) return
  const file = targetOf(choice.preset)
  applied.value = null
  const outcome = await applyPreset(choice.preset)
  applied.value = { preset: choice.preset, file: file ? file.split('/').pop()! : null, ...outcome }
}

/** A result that is on screen but was not written by this deck instance. */
const missedResult = computed(() => !!result.value && !applied.value && hub.isPresenter.value && appliedClose !== (poll.value?.closesAt ?? 0))

const rows = computed(() =>
  props.choices.map((c, i) => {
    const n = tally.value?.counts[i] ?? 0
    const pct = total.value ? (100 * n) / total.value : 0
    return { i, label: c.label, n, pct, winner: result.value?.winner === i }
  }),
)
const showCounts = computed(() => !!tally.value && (hub.isPresenter.value || !open.value))
</script>

<template>
  <div class="gc viz-card">
    <div class="gc-head">
      <span class="viz-label accent">The room decides</span>
      <span v-if="secondsLeft !== null" class="gc-clock" :class="{ late: secondsLeft <= 5 }">{{ secondsLeft }}s</span>
      <span v-else-if="live && hub.state.presenterRejected" class="gc-room viz-bad">presenter token rejected</span>
      <span v-else-if="live && hub.state.connected" class="gc-room"><b>{{ hub.state.audienceCount }}</b> in the room</span>
      <span v-else-if="live" class="gc-room viz-warn">hub offline</span>
    </div>

    <p class="gc-question">{{ question }}</p>

    <ol class="gc-options">
      <li v-for="r in rows" :key="r.i" class="gc-opt" :class="{ winner: r.winner, faded: result && !r.winner }">
        <span class="gc-key">{{ String.fromCharCode(65 + r.i) }}</span>
        <span class="gc-label">{{ r.label }}</span>
        <span v-if="showCounts" class="gc-n">{{ r.n }}</span>
        <span class="gc-bar"><i :style="{ width: showCounts ? `${r.pct}%` : '0%' }" /></span>
      </li>
    </ol>

    <div class="gc-foot">
      <template v-if="result">
        <span>
          The room chose <b>{{ choices[result.winner]?.label }}</b>
          <span class="gc-muted"> · {{ total }} {{ total === 1 ? 'vote' : 'votes' }}</span>
        </span>
        <span v-if="applied" :class="applied.ok ? 'viz-ok' : 'viz-bad'">
          <template v-if="applied.ok">{{ applied.file }} updated</template>
          <template v-else>{{ applied.error }}</template>
        </span>
        <span v-else-if="missedResult" class="viz-warn">closed while this deck was away; not written. Press ← then → to ask again</span>
        <span v-else-if="hub.isPresenter" class="gc-muted">writing…</span>
      </template>
      <template v-else-if="open">
        <span>Vote now on your phone</span>
        <span v-if="hub.isPresenter"><b>{{ total }}</b> so far</span>
      </template>
      <template v-else-if="live && hub.isPresenter"><span class="gc-muted">Press → to ask the room ({{ seconds }} s)</span></template>
    </div>
  </div>
</template>

<style scoped>
.gc {
  gap: 0.6rem;
  height: 100%;
}
.gc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.gc-head .viz-label {
  margin: 0;
}
.gc-clock {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 1.4rem;
  color: var(--cs50-body);
  line-height: 1;
}
.gc-clock.late {
  color: var(--cs50-crimson);
}
.gc-room {
  font-size: 0.8rem;
  color: var(--cs50-muted);
}
.gc-room b {
  color: var(--cs50-body);
}
.gc-question {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.25;
}
.gc-options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
  align-content: start;
}
.gc-opt {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 0.6rem;
  row-gap: 0.3rem;
  padding: 0.5rem 0.7rem 0.45rem;
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  background: #fff;
  transition: border-color 250ms, box-shadow 250ms, opacity 250ms;
}
.gc-opt.winner {
  border-color: var(--cs50-crimson);
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.15);
}
.gc-opt.faded {
  opacity: 0.55;
}
.gc-key {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.66rem;
  font-weight: 700;
  background: #f1f3f5;
  color: var(--cs50-muted);
}
.gc-opt.winner .gc-key {
  background: var(--cs50-crimson);
  color: #fff;
}
.gc-label {
  font-weight: 700;
  font-size: 0.95rem;
}
.gc-n {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.gc-bar {
  grid-column: 1 / -1;
  display: block;
  height: 5px;
  border-radius: 3px;
  background: #e9ecef;
  overflow: hidden;
}
.gc-bar i {
  display: block;
  height: 100%;
  background: var(--cs50-crimson);
  transition: width 350ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.gc-foot {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--cs50-body);
  min-height: 1.4em;
}
.gc-muted {
  color: var(--cs50-muted);
}
</style>
