<script setup lang="ts">
/**
 * AudienceChoice — on a deck that is following along, a `choice` vote takes
 * over the slide: the question, big buttons, a countdown, then the verdict.
 * Phones on /join get the same thing from join.html; this is for a phone
 * that chose "Follow the slides" instead, wherever in the deck it is.
 *
 * Never shown to the presenter.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { canFollow } from '../composables/hubSync'
import { useHub } from '../composables/useHub'

/** How long the verdict stays up after the vote closes. */
const LINGER_MS = 7000

const hub = useHub()
const poll = computed(() => (hub.state.poll?.kind === 'choice' ? hub.state.poll : null))
const open = computed(() => !!poll.value?.open)
const result = computed(() => (poll.value && hub.state.result?.pollId === poll.value.id ? hub.state.result : null))

const now = ref(Date.now())
let ticker = 0
const lingerUntil = ref(0)

// The verdict stays up a few seconds after the vote closes.
watch(open, (o, was) => {
  if (!o && was) lingerUntil.value = Date.now() + LINGER_MS
})
// Tick only while there is something to count down or to linger.
const active = computed(() => open.value || now.value < lingerUntil.value)
watch(
  active,
  (a) => {
    clearInterval(ticker)
    if (a) ticker = window.setInterval(() => (now.value = Date.now()), 200)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(ticker))

const visible = computed(() => canFollow.value && !!poll.value && active.value)

const secondsLeft = computed(() => {
  const closesAt = poll.value?.closesAt
  if (!open.value || !closesAt) return null
  return Math.max(0, Math.ceil((closesAt - (now.value + hub.state.clockSkew)) / 1000))
})

const mine = computed(() => hub.state.vote)
</script>

<template>
  <transition name="ac">
    <div v-if="visible && poll" class="ac" role="dialog" aria-live="polite">
      <div class="ac-card">
        <div class="ac-head">
          <span class="viz-label accent">The room decides</span>
          <span v-if="secondsLeft !== null" class="ac-clock" :class="{ late: secondsLeft <= 5 }">{{ secondsLeft }}s</span>
        </div>
        <p class="ac-question">{{ poll.question }}</p>
        <div class="ac-options">
          <button
            v-for="(label, i) in poll.options"
            :key="i"
            type="button"
            class="ac-opt"
            :class="{ mine: mine === i, winner: result?.winner === i, faded: result && result.winner !== i }"
            :disabled="!open"
            @click="hub.vote(i)"
          >
            <span class="ac-key">{{ String.fromCharCode(65 + i) }}</span>
            <span>{{ label }}</span>
          </button>
        </div>
        <div class="ac-foot">
          <template v-if="result">
            <span v-if="mine !== null">You picked <b>{{ poll.options[mine] }}</b>. </span>
            The room chose <b>{{ poll.options[result.winner] }}</b>.
          </template>
          <template v-else-if="mine !== null">Got it. You can still change your mind.</template>
          <template v-else>Tap to choose.</template>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.ac {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(3px);
}
.ac-card {
  width: min(100%, 30rem);
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--cs50-border);
  border-top: 4px solid var(--cs50-crimson);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 40px rgba(33, 37, 41, 0.14);
}
.ac-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ac-head .viz-label {
  margin: 0;
}
.ac-clock {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 1.4rem;
  line-height: 1;
}
.ac-clock.late {
  color: var(--cs50-crimson);
}
.ac-question {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
}
.ac-options {
  display: grid;
  gap: 0.5rem;
}
.ac-opt {
  appearance: none;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-align: left;
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.75rem 0.9rem;
  border: 2px solid var(--cs50-border);
  border-radius: 10px;
  background: #fff;
  color: var(--cs50-body);
  cursor: pointer;
  touch-action: manipulation;
  transition: border-color 150ms, background-color 150ms, opacity 250ms;
}
.ac-opt:disabled {
  cursor: default;
}
.ac-opt.mine {
  border-color: var(--cs50-crimson);
  background: var(--cs50-crimson-soft);
}
.ac-opt.winner {
  border-color: #198754;
  background: #d1e7dd;
}
.ac-opt.faded {
  opacity: 0.55;
}
.ac-key {
  flex: none;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  background: #f1f3f5;
  color: var(--cs50-muted);
}
.ac-opt.mine .ac-key {
  background: var(--cs50-crimson);
  color: #fff;
}
.ac-foot {
  font-size: 0.9rem;
  color: var(--cs50-muted);
  min-height: 1.3em;
}
.ac-foot b {
  color: var(--cs50-body);
}
.ac-enter-active,
.ac-leave-active {
  transition: opacity 250ms;
}
.ac-enter-from,
.ac-leave-to {
  opacity: 0;
}
</style>
