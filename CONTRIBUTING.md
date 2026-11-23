# Contributing

Thanks for looking. This is the deck for one CS50 lecture, so the bar for a change is: would it make the lecture better, or make it easier for someone else to give or study? Fixes to facts, questions for the finale, a line for an NPC, a visualization that could say more, a bug in the hub: all welcome. New slides and new concepts are a bigger conversation; open an issue first.

## Setting up

Node 22.12+ and pnpm 11. Then:

```sh
pnpm install
pnpm dev          # the deck at http://localhost:3030
pnpm test         # must stay green
```

The README's [Running the whole thing locally](./README.md#running-the-whole-thing-locally) covers the audience hub; you need it only for changes to voting, following, or the finale's questions.

## Before you open a pull request

- `pnpm test` passes. The tests cover the hub's rules, the battle (every combination of right and wrong answers), the live demo's start and solution files, the presets, and the editor's sync logic. Add a test when you change behaviour in any of those.
- If you touched a slide, a layout, a style or a visualization, run the layout audit: start a second dev server with `pnpm exec slidev --port 3031`, then `pnpm audit:layout` (or a range, `pnpm audit:layout -- 3031 40-50`). It loads every slide at every click and fails if anything is clipped. A glance at a slide's final state misses clipping at earlier clicks.
- If you changed `slides.md`, the slide table in the README ("The deck") and the `58 slides` heading still match.
- If you changed the live demo's files, `pnpm demo status` reads `start` for both before you commit. `pnpm demo reset` puts them back.

## Conventions

**Writing.** The slides and notes follow the CS50 website's voice: second person, plain words, short sentences, "notice how" and "recall that" rather than jargon. No filler, no hype. Every claim about CS50 Finance comes from the Problem Set 9 specification; every claim about a tool comes from that tool's current documentation. If you are not sure something is true, leave it out or ask.

**Design.** One accent color, crimson `#a51c30`, for the term or sentence that matters on a slide; everything else is body text in the Bootstrap neutrals. The tokens are in `styles/index.css`; use them rather than new colors. PT Sans is bundled; no other fonts. The deck makes no network requests at runtime beyond its own hub, and that should stay true.

**Visualizations.** Each one claims its click steps through `composables/useVizSteps.ts`, so `→` drives it like `v-click`. It should have a finished state that reads well as a still image (that is what the PDF shows), respect `prefers-reduced-motion`, and keep its on-slide hints behind `SHOW_HINTS` in `components/viz/config.ts`.

**The finale's questions** live in `demo/gym/battle.ts` as data: a move Sloppyclaude uses (something an AI says while being wrong), a question, four options, the right one, and a one-line explanation. A question should be answerable from the lecture alone, and its wrong options should be the mistakes a student would actually make. The test suite checks the pool is large enough that a battle never runs out.

**Code.** TypeScript throughout, no framework in `demo/`, Vue 3 with `<script setup>` in components. The hub's rules (`server/hub.ts`) do no I/O and return the messages to send, so they can be tested without sockets; keep it that way. Comments explain why, not what.

**Commits.** Short, lowercase, present tense, with a type prefix as in the history: `fix: the room follows whichever window the presenter drives from`, `feat: a new run of the deck is a new room`, `chore: plainer labels and titles`. The body, when there is one, says what was wrong and what changed, in sentences.

## Pull requests

One change per pull request. Say what you changed and why, how you checked it, and what you did not do on purpose. A screenshot helps for anything visual. CI runs the tests and a build on every pull request.

Pushes to `main` deploy the hosted copy that CS50 presents from, so merging is for maintainers; expect a review before that.

## Reporting problems

Use the issue templates. For anything about the hub's security, see [SECURITY.md](./SECURITY.md) instead of opening a public issue. Everyone here is expected to follow the [code of conduct](./CODE_OF_CONDUCT.md).
