<script setup lang="ts">
/**
 * ChatSim — Concept 2. A scripted chat about /buy, one turn per step, with a
 * ledger that tallies who did each piece of work. The point lands in the
 * ledger: the model wrote; you read, ran, caught, and re-prompted.
 */
import { computed } from 'vue'
import { useVizSteps } from '../../composables/useVizSteps'
import CodeSnippet from './CodeSnippet.vue'

const buyV1 = `@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    if request.method == "POST":
        symbol = request.form.get("symbol")
        shares = int(request.form.get("shares"))
        quote = lookup(symbol)
        cost = shares * quote["price"]
        cash = db.execute("SELECT cash FROM users WHERE id = ?",
                          session["user_id"])[0]["cash"]
        if cost > cash:
            return apology("can't afford")
        db.execute("UPDATE users SET cash = cash - ? WHERE id = ?",
                   cost, session["user_id"])
        return redirect("/")`

const buyV2 = `shares = request.form.get("shares")
if not shares.isdigit() or int(shares) < 1:
    return apology("shares must be a positive integer")
shares = int(shares)`

interface Turn {
  who: 'you' | 'model'
  text?: string
  code?: string
  mark?: number[]
  /** Ledger entries this turn adds. */
  work: { who: 'you' | 'model'; what: string }[]
}

const turns: Turn[] = [
  { who: 'you', text: 'Write /buy for my Flask app.', work: [{ who: 'you', what: 'asked' }] },
  { who: 'model', code: buyV1, work: [{ who: 'model', what: 'wrote 15 lines' }] },
  {
    who: 'you',
    text: 'I ran it. I just bought −5 shares of NFLX and my cash went up.',
    work: [
      { who: 'you', what: 'read the code' },
      { who: 'you', what: 'ran it' },
      { who: 'you', what: 'found the bug' },
    ],
  },
  {
    who: 'model',
    text: 'You\u2019re right. Validate shares before using it:',
    code: buyV2,
    work: [{ who: 'model', what: 'wrote 4 lines' }],
  },
  {
    who: 'you',
    text: 'Now 1.5 is rejected too, which is what the spec wants. And negative cash? Let me check\u2026',
    work: [
      { who: 'you', what: 'read it again' },
      { who: 'you', what: 'ran it again' },
      { who: 'you', what: 'kept testing' },
    ],
  },
]

const { step, at } = useVizSteps(turns.length)
const visible = computed(() => turns.slice(0, step.value))
const ledger = computed(() => visible.value.flatMap((t) => t.work))
const yours = computed(() => ledger.value.filter((w) => w.who === 'you'))
const models = computed(() => ledger.value.filter((w) => w.who === 'model'))

/** Highlight the bug line once "you" have found it. */
const bugMark = computed(() => (at(3) ? [6] : []))
</script>

<template>
  <div class="viz chat">
    <section class="viz-card thread">
      <div class="viz-label">Chat</div>
      <div class="turns">
        <div v-for="(t, i) in visible" :key="i" class="turn" :class="t.who">
          <div class="who">{{ t.who === 'you' ? 'You' : 'Model' }}</div>
          <div class="bubble">
            <p v-if="t.text">{{ t.text }}</p>
            <CodeSnippet v-if="t.code" :code="t.code" lang="python" :mark="i === 1 ? bugMark : []" />
          </div>
        </div>
        <div v-if="!visible.length" class="empty">Press → to ask.</div>
      </div>
    </section>

    <section class="viz-card ledger">
      <div class="viz-label">Who did the work</div>
      <div class="cols">
        <div>
          <div class="head">Model <span class="count">{{ models.length }}</span></div>
          <ul>
            <li v-for="(w, i) in models" :key="i" class="viz-enter shown">{{ w.what }}</li>
          </ul>
        </div>
        <div>
          <div class="head you">You <span class="count">{{ yours.length }}</span></div>
          <ul>
            <li v-for="(w, i) in yours" :key="i" class="viz-enter shown">{{ w.what }}</li>
          </ul>
        </div>
      </div>
      <div class="verdict viz-enter" :class="{ shown: at(turns.length) }">
        The model typed. <b>You</b> were the debugger, the tester, and the glue.
      </div>
    </section>
  </div>
</template>

<style scoped>
.chat {
  grid-template-columns: 1.5fr 1fr;
}
.turns {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.45rem;
}
.turn {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: 0.5rem;
  align-items: start;
  animation: rise 300ms ease both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
.who {
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--cs50-muted);
  padding-top: 0.45rem;
}
.turn.you .who {
  color: var(--cs50-crimson);
}
.bubble {
  border-radius: 10px;
  padding: 0.45rem 0.7rem;
  background: var(--cs50-code-bg);
  border: 1px solid var(--cs50-border);
  font-size: 0.82rem;
  line-height: 1.4;
}
.turn.you .bubble {
  background: rgba(165, 28, 48, 0.06);
  border-color: rgba(165, 28, 48, 0.25);
}
.bubble p {
  margin: 0 0 0.3rem;
}
.bubble p:last-child {
  margin-bottom: 0;
}
.bubble :deep(.snippet pre) {
  font-size: 0.62rem;
  line-height: 1.4;
}
.empty {
  color: var(--cs50-muted);
  text-align: center;
  margin: auto;
}
.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  flex: 1;
}
.head {
  font-weight: 700;
  border-bottom: 2px solid var(--cs50-body);
  padding-bottom: 0.25rem;
  margin-bottom: 0.4rem;
  display: flex;
  justify-content: space-between;
}
.head.you {
  color: var(--cs50-crimson);
  border-color: var(--cs50-crimson);
}
.count {
  font-variant-numeric: tabular-nums;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
}
li {
  padding: 0.18rem 0;
  border-bottom: 1px dashed var(--cs50-rule);
}
.verdict {
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 1px solid var(--cs50-rule);
  font-size: 0.86rem;
}
.verdict b {
  color: var(--cs50-crimson);
}
</style>
