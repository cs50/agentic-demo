<script setup lang="ts">
/**
 * LivePoll — a question the room answers on their phones, with the bars
 * filling in on the big screen.
 *
 * Two presses, like every other visualization (useVizSteps):
 *   →  opens the poll on the hub (phones light up)
 *   →  closes it (phones see the result)
 * Only the presenter's deck talks to the hub; both the slide and presenter
 * views press the same steps and the hub ignores the duplicate.
 *
 * What is shown comes from the hub, not from the step, so a reloaded tab or a
 * late-arriving presenter view draws the real state. Live counts are visible
 * to the presenter only; the audience's copy of the deck shows the bars once
 * the poll has closed, and its options are tappable while it is open, so a
 * phone that follows the deck can vote without switching to /join.
 */
import { computed, onMounted, watch } from 'vue'
import { useHub } from '../composables/useHub'
import { useLive } from '../composables/useLive'
import { useVizSteps } from '../composables/useVizSteps'

const props = withDefaults(
  defineProps<{
    /** Stable across reloads; the hub dedupes by it. One per poll in the deck. */
    id: string
    question: string
    options: string[]
    /** Smaller type, for a poll beside something else. */
    compact?: boolean
  }>(),
  { compact: false },
)

const hub = useHub()
const live = useLive()
const { step } = useVizSteps(2)

onMounted(() => live && hub.connect())

watch(step, (now, before) => {
  if (!live || !hub.isPresenter.value) return
  if (now === 1 && before === 0) hub.openPoll({ id: props.id, question: props.question, options: props.options })
  if (now === 2 && before === 1) hub.closePoll(props.id)
})

/** The hub's poll, if it is this one. */
const poll = computed(() => (hub.state.poll?.id === props.id ? hub.state.poll : null))
const status = computed<'pending' | 'open' | 'closed'>(() => (poll.value ? (poll.value.open ? 'open' : 'closed') : 'pending'))
const tally = computed(() => (hub.state.tally?.pollId === props.id ? hub.state.tally : null))
const total = computed(() => tally.value?.total ?? 0)
const myVote = computed(() => (poll.value ? hub.state.vote : null))
const canVote = computed(() => live && status.value === 'open' && !hub.isPresenter.value)

const rows = computed(() =>
  props.options.map((label, i) => {
    const n = tally.value?.counts[i] ?? 0
    const pct = total.value ? (100 * n) / total.value : 0
    const max = Math.max(...(tally.value?.counts ?? [0]))
    return { i, label, n, pct, leading: !!tally.value && total.value > 0 && n === max }
  }),
)

const spokenJoin = computed(() => hub.joinUrl().replace(/^https?:\/\//, ''))
</script>

<template>
  <div class="viz lp" :class="{ compact }">
    <div class="lp-head">
      <span class="viz-pill" :class="{ crimson: status === 'open', ok: status === 'closed' }">
        <template v-if="status === 'open'">Open</template>
        <template v-else-if="status === 'closed'">Closed</template>
        <template v-else>Poll</template>
      </span>
      <span v-if="live && hub.state.connected" class="lp-room">
        <b>{{ hub.state.audienceCount }}</b> in the room
      </span>
      <span v-else-if="live" class="lp-room viz-warn">hub offline</span>
    </div>

    <p class="lp-question">{{ question }}</p>

    <div class="lp-options" role="group">
      <button
        v-for="r in rows"
        :key="r.i"
        type="button"
        class="lp-opt"
        :class="{ mine: myVote === r.i, leading: status === 'closed' && r.leading, votable: canVote }"
        :disabled="!canVote"
        @click="canVote && hub.vote(r.i)"
      >
        <span class="lp-key">{{ String.fromCharCode(65 + r.i) }}</span>
        <span class="lp-label">{{ r.label }}</span>
        <span v-if="tally" class="lp-n">{{ r.n }} <span class="lp-pct">· {{ Math.round(r.pct) }}%</span></span>
        <span class="lp-bar"><i :style="{ width: `${r.pct}%` }" /></span>
      </button>
    </div>

    <div class="lp-foot">
      <template v-if="status === 'open'">
        <span v-if="hub.isPresenter"><b>{{ total }}</b> {{ total === 1 ? 'vote' : 'votes' }} so far</span>
        <span>Vote at <b class="viz-mono">{{ spokenJoin }}</b></span>
      </template>
      <template v-else-if="status === 'closed'">
        <span><b>{{ total }}</b> {{ total === 1 ? 'vote' : 'votes' }}</span>
      </template>
      <template v-else-if="live && hub.isPresenter"><span>Press → to open the poll</span></template>
    </div>
  </div>
</template>

<style scoped>
.lp {
  grid-template-rows: auto auto 1fr auto;
  gap: 0.7rem;
  align-content: start;
}
.lp.compact {
  font-size: 0.78rem;
  gap: 0.5rem;
}
.lp-head {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.lp-room {
  font-size: 0.85rem;
  color: var(--cs50-muted);
}
.lp-room b {
  color: var(--cs50-body);
}
.lp-question {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.2;
}
.lp.compact .lp-question {
  font-size: 1.1rem;
}
.lp-options {
  display: grid;
  gap: 0.55rem;
  align-content: start;
  min-height: 0;
}
.lp-opt {
  appearance: none;
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 0.75rem;
  row-gap: 0.35rem;
  text-align: left;
  font: inherit;
  padding: 0.65rem 0.9rem 0.6rem;
  border: 1px solid var(--cs50-border);
  border-radius: 8px;
  background: #fff;
  color: var(--cs50-body);
  cursor: default;
  transition: border-color 200ms, background-color 200ms, box-shadow 200ms;
}
.lp-opt.votable {
  cursor: pointer;
}
.lp-opt.votable:hover {
  border-color: var(--cs50-crimson);
}
.lp-opt.mine {
  border-color: var(--cs50-crimson);
  background: var(--cs50-crimson-soft);
}
.lp-opt.leading {
  border-color: var(--cs50-crimson);
  box-shadow: 0 0 0 3px rgba(165, 28, 48, 0.15);
}
.lp-key {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  background: #f1f3f5;
  color: var(--cs50-muted);
}
.lp-opt.mine .lp-key,
.lp-opt.leading .lp-key {
  background: var(--cs50-crimson);
  color: #fff;
}
.lp-label {
  font-size: 1.05rem;
  font-weight: 700;
}
.lp.compact .lp-label {
  font-size: 0.9rem;
}
.lp-n {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 1rem;
}
.lp-pct {
  font-weight: 400;
  color: var(--cs50-muted);
  font-size: 0.85rem;
}
.lp-bar {
  grid-column: 1 / -1;
  display: block;
  height: 6px;
  border-radius: 3px;
  background: #e9ecef;
  overflow: hidden;
}
.lp-bar i {
  display: block;
  height: 100%;
  background: var(--cs50-crimson);
  transition: width 350ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.lp-foot {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--cs50-muted);
  min-height: 1.4em;
}
.lp-foot b {
  color: var(--cs50-body);
}
</style>
