# Presenting and maintaining

For whoever gives the lecture or keeps the deck current. Students who just want to run or read the slides need only the [README](../README.md).

## Presenting

The order that works, with a hub already running (yours, or the hosted one with its token in `.env.local`):

1. Plug in the controller and press a button once; browsers expose a gamepad only after a physical press.
2. `pnpm demo status`, and `pnpm demo reset` if either file is not at `start`.
3. `pnpm dev`. Open the slide view for the projector and `/presenter/1` for your notes by typing the URLs; both windows drive the room. Do not open the deck in any other tab: under `pnpm dev` every window is a presenter and Slidev keeps them in step, so a stray tab moves the slides.
4. On slide 2 the headcount should be live. In either window's console, `__hub.state.role` should be `"presenter"` and `__hubSync.channels.size` should be `2`.

Each `pnpm dev` run is a new lecture: the first presenter window from a new run makes the hub forget the previous one (poll, votes, slide position), so phones that scan in are never following a rehearsal. Windows and reconnects from the same run change nothing. `__hub.reset()` in the console does the same by hand.

Phones vote at `/join` and follow the slides at the hub's root. Following is on by default; a phone that swipes on its own reads *Unlocked*, and tapping that catches up. If a question in the finale closes with nobody having voted, the panel says so and you answer with the controller: ↑ ↓ then ✕.

Afterwards, `pnpm demo reset`.

## Working on the deck

What to run and what to keep in mind when changing things, whether for a lecture of your own or to keep this one current.

**Checks.** `pnpm test` covers the hub's rules, the battle (every combination of right and wrong answers), the live demo's start and solution files, the presets, and the editor's sync logic; add a test when you change behaviour in any of those. After touching a slide, a layout, a style or a visualization, run the layout audit: start a second dev server with `pnpm exec slidev --port 3031`, then `pnpm audit:layout` (or a range, `pnpm audit:layout -- 3031 40-50`). It loads every slide at every click and fails if anything is clipped; a glance at a slide's final state misses clipping at earlier clicks. After changing `slides.md`, the slide table in [how-it-is-built.md](./how-it-is-built.md) should still match. Before committing, `pnpm demo status` should read `start` for both live files; `pnpm demo reset` puts them back.

**Writing.** The slides and notes follow the CS50 website's voice: second person, plain words, short sentences, "notice how" and "recall that" rather than jargon. No filler, no hype. Every claim about CS50 Finance comes from the Problem Set 9 specification; every claim about a tool comes from that tool's current documentation.

**Design.** One accent color, crimson `#a51c30`, for the term or sentence that matters on a slide; everything else is body text in the Bootstrap neutrals. The tokens are in `styles/index.css`. PT Sans is bundled; no other fonts. The deck makes no network requests at runtime beyond its own hub.

**Visualizations.** Each one claims its click steps through `composables/useVizSteps.ts`, so `→` drives it like `v-click`. It has a finished state that reads well as a still image (that is what the PDF shows), respects `prefers-reduced-motion`, and keeps its on-slide hints behind `SHOW_HINTS` in `components/viz/config.ts`.

**The finale's questions** live in `demo/gym/battle.ts` as data: a move Sloppyclaude uses (something an AI says while being wrong), a question, four options, the right one, and a one-line explanation. A question should be answerable from the lecture alone, and its wrong options should be the mistakes a student would actually make. The tests check the pool is large enough that a battle never runs out.

**Code.** TypeScript throughout, no framework in `demo/`, Vue 3 with `<script setup>` in components. The hub's rules (`server/hub.ts`) do no I/O and return the messages to send, so they can be tested without sockets. Comments explain why, not what. Commit messages are short, lowercase, present tense, with a type prefix: `fix: the room follows whichever window the presenter drives from`.

**Security.** The hub runs on the public internet during lectures. Anything about its security goes through [SECURITY.md](../SECURITY.md), privately.

## Hosting

This is how the CS50 copy runs; nothing in it is needed to work on the deck.

Pushes to `main` build the deck and deploy it with the hub as one Docker container to Elastic Beanstalk (`.github/workflows/main.yml`, `Dockerfile`), where the hosted deck connects to its own origin and needs no `VITE_HUB_URL`. The workflow runs install, tests and build on every push and pull request; only `main` (or a manual run) deploys, with AWS credentials from repository secrets. The environment must stay at one instance (the room's state is in that process's memory), needs `PRESENTER_TOKEN` set as an environment property (the hub refuses to start in production without one, so a forgotten token fails the health check instead of accepting a guessable default), and its instances need a public IP (`aws:ec2:vpc AssociatePublicIpAddress=true`). `.ebextensions/hub.config` records the rest. With the EB CLI installed, `eb status`, `eb logs` and `eb printenv` work from the repo (`.elasticbeanstalk/config.yml`). When exporting the PDF for the lecture, keep `.env.local` pointed at the hosted hub so the QR code on slide 2 encodes the right address.
