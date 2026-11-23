<script setup lang="ts">
/**
 * AudienceQR — the "join us" slide: a QR code for the audience page, the
 * address in words for anyone whose camera won't cooperate, and a live count
 * of who has arrived.
 *
 * The QR encodes `joinUrl()` from useHub (derived from VITE_HUB_URL, or the
 * page's origin on the hosted deck) and is drawn in the browser, so no network
 * request is needed and the deck still has none at runtime beyond the hub.
 */
import QRCode from 'qrcode'
import { computed, onMounted, ref } from 'vue'
import { useHub } from '../composables/useHub'
import { useLive } from '../composables/useLive'

const props = withDefaults(
  defineProps<{
    /** Override the encoded URL (e.g. a short link that redirects to /join). */
    url?: string
    /** One line under the QR, for the room. */
    prompt?: string
  }>(),
  { prompt: 'Scan to join. Vote, ask, and follow along on your phone.' },
)

const hub = useHub()
const live = useLive()

const url = computed(() => props.url ?? hub.joinUrl())
/** The address as people read it aloud: no scheme, no trailing slash. */
const spoken = computed(() => url.value.replace(/^https?:\/\//, '').replace(/\/$/, ''))

const svg = ref('')
onMounted(async () => {
  if (live) hub.connect()
  svg.value = await QRCode.toString(url.value, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#212529', light: '#ffffff' },
  })
})

const count = computed(() => hub.state.audienceCount)
</script>

<template>
  <div class="viz aq">
    <div class="aq-qr" v-html="svg" />
    <div class="aq-side">
      <div class="viz-label accent">Join the room</div>
      <div class="aq-url viz-mono">{{ spoken }}</div>
      <p class="aq-prompt">{{ prompt }}</p>
      <div class="aq-count" :class="{ on: live && hub.state.connected }">
        <template v-if="live && hub.state.connected">
          <b>{{ count }}</b> {{ count === 1 ? 'person is' : 'people are' }} in the room
        </template>
        <template v-else-if="live">connecting to the hub…</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aq {
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 2.4rem;
  padding: 0.6rem 0;
}
.aq-qr {
  width: min(44vh, 380px);
  aspect-ratio: 1;
  border: 1px solid var(--cs50-border);
  border-radius: 10px;
  padding: 0.6rem;
  background: #fff;
}
.aq-qr :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  shape-rendering: crispEdges;
}
.aq-side {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}
.aq-url {
  font-size: 2rem;
  font-weight: 700;
  color: var(--cs50-crimson);
  word-break: break-all;
  line-height: 1.15;
}
.aq-prompt {
  margin: 0;
  font-size: 1.05rem;
  color: var(--cs50-body);
}
.aq-count {
  margin-top: 0.4rem;
  font-size: 1rem;
  color: var(--cs50-muted);
  min-height: 1.5em;
}
.aq-count.on b {
  font-size: 1.6rem;
  color: var(--cs50-crimson);
  font-variant-numeric: tabular-nums;
}
</style>
