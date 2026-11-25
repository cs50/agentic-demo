# The Agentic Software Engineer

The deck for a CS50 lecture on agentic software engineering, with everything it needs to be given: 58 slides built with [Slidev](https://sli.dev), a live demo in which an agent turns Week 1's `mario.c` into a playable game under a PS4 controller while the room watches the code change, an audience hub so students vote and follow along from their phones, and a finale in which the CS50 duck walks Harvard Yard and battles a monster that speaks in AI slop.

The lecture is grounded in CS50 Finance and CS50 Mario, so a student who has finished Problem Set 9 can read every example. The spec the deck was built from is [`agentic-coding-lecture-spec.md`](./agentic-coding-lecture-spec.md).

- [Quick start](#quick-start)
- [Running the whole thing locally](#running-the-whole-thing-locally)
- [Commands](#commands)
- [Presenting](#presenting)
- [How it is built](#how-it-is-built): [the deck](#the-deck), [the visualizations](#the-visualizations), [the live demo](#the-live-demo), [the room](#the-room), [the finale](#the-finale)
- [Project map](#project-map)
- [Working on the deck](#working-on-the-deck)
- [Hosting](#hosting)
- [License](#license)

## Quick start

You need [Node.js](https://nodejs.org) 22.12 or newer (CI uses 24) and [pnpm](https://pnpm.io) 11.

```sh
git clone https://github.com/cs50/agentic-demo.git
cd agentic-demo
pnpm install
pnpm dev
```

That opens the deck at <http://localhost:3030>. Arrow keys move through the slides; `→` also drives every visualization. Press `o` for the overview and `p` for the presenter view with notes.

Just want to read the slides? Every push to `main` builds them as a PDF and publishes it as the [latest release](https://github.com/cs50/agentic-demo/releases/latest); the direct link is [the-agentic-software-engineer.pdf](https://github.com/cs50/agentic-demo/releases/latest/download/the-agentic-software-engineer.pdf). It shows each slide at its finished state; the notes, the demo, the room and the finale are only in the running deck.

Without an audience hub the deck still works: the join slide says it cannot reach one, the finale's questions are answered with the keyboard or a controller, and nothing else changes. To run the hub too, read on.

## Running the whole thing locally

Nothing here needs an account anywhere. The hub is one small Node process (`server/`) that serves the built deck and relays polls, votes and slide position over a websocket. Phones on the same wifi as your laptop can join it.

**1. Configure.** Copy `.env.example` to `.env.local` (it is gitignored) and set two values:

```sh
VITE_HUB_URL=ws://192.168.1.20:8080      # your laptop's address on the room's wifi, port 8080
PRESENTER_TOKEN=any-string-you-like      # the deck and the hub both read it
VITE_PRESENTER_TOKEN=${PRESENTER_TOKEN}  # leave this line as it is
```

`VITE_HUB_URL` is both where the deck connects and what the QR code encodes, so use the address phones can reach, not `localhost` (`ws://localhost:8080` is fine when you are alone). Find your address with `ipconfig getifaddr en0` on macOS or `hostname -I` on Linux.

**2. Start the hub.**

```sh
pnpm hub
```

It listens on `:8080` and prints its address. It reads `PRESENTER_TOKEN` from `.env.local`; without one it generates a random token and prints it, which the deck will not know, so set the file first.

**3. Start the deck.**

```sh
pnpm dev
```

The dev deck reads `.env.local` too, so it connects to your hub as the presenter. The join slide (slide 2) shows a QR code and a live headcount. Open `http://192.168.1.20:8080/join` (your address) on a phone and the count goes up. When the finale asks a question, the phone shows the answers as buttons.

**4. Optional: serve the deck from the hub.** `pnpm build` writes the deck to `dist/`, which the hub serves at its root, so phones can also open `http://192.168.1.20:8080` and follow the slides as you move. The hosted deck is exactly this: a build plus the hub in one container.

If anything is off, the join slide tells you. *connecting to the hub…* that never resolves means the deck cannot reach `VITE_HUB_URL`; **presenter token rejected** means the deck's token and the hub's differ. Vite reads `.env.local` at start, so restart `pnpm dev` after editing it.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | The deck at <http://localhost:3030>, as presenter if `.env.local` has a token. |
| `pnpm hub` | The audience hub on `:8080`, reading `.env.local`. |
| `pnpm build` | Builds the deck into `dist/`, which the hub serves. |
| `pnpm export` | Writes `slides-export.pdf`, the offline backup: every slide at its finished state, except those marked `export: false` in their frontmatter (the two join slides, whose QR code and headcount mean nothing on paper). Uses the Chromium that `pnpm install` downloads (if it reports a missing browser, `pnpm exec playwright install chromium-headless-shell`). CI does the same on every push to `main` and publishes the file as the latest release (`.github/workflows/slides.yml`). |
| `pnpm test` | Unit tests: the hub's rules and its relay over real sockets, the editor's sync logic, the battle, the demo's start and solution files, the presets. |
| `pnpm audit:layout` | Loads every slide at every click in a headless browser and fails if anything is clipped. Needs a dev server on `:3031` (`pnpm exec slidev --port 3031`); pass another port and a slide range as `pnpm audit:layout -- 3030 36-50`. Takes a few minutes. |
| `pnpm demo status` | Whether the live demo's two files are at their start state. `pnpm demo reset` puts them there; `pnpm demo solve [level\|physics]` copies the solutions in. |
| `pnpm hub:loadtest [ws://host/ws] [N]` | Simulates N phones joining, voting at once and following slide changes while the hub's memory is watched. |

The deck makes no network requests at runtime beyond its own hub: PT Sans is bundled from npm and the QR code is drawn in the browser.

## Presenting

The order that works, with a hub already running (yours, or the hosted one with its token in `.env.local`):

1. Plug in the controller and press a button once; browsers expose a gamepad only after a physical press.
2. `pnpm demo status`, and `pnpm demo reset` if either file is not at `start`.
3. `pnpm dev`. Open the slide view for the projector and `/presenter/1` for your notes by typing the URLs; both windows drive the room. Do not open the deck in any other tab: under `pnpm dev` every window is a presenter and Slidev keeps them in step, so a stray tab moves the slides.
4. On slide 2 the headcount should be live. In either window's console, `__hub.state.role` should be `"presenter"` and `__hubSync.channels.size` should be `2`.

Each `pnpm dev` run is a new lecture: the first presenter window from a new run makes the hub forget the previous one (poll, votes, slide position), so phones that scan in are never following a rehearsal. Windows and reconnects from the same run change nothing. `__hub.reset()` in the console does the same by hand.

Phones vote at `/join` and follow the slides at the hub's root. Following is on by default; a phone that swipes on its own reads *Unlocked*, and tapping that catches up. If a question in the finale closes with nobody having voted, the panel says so and you answer with the controller: ↑ ↓ then ✕.

Afterwards, `pnpm demo reset`.

## How it is built

### The deck

The deck follows the course website's look: a white page, crimson `#a51c30` as the one accent color, PT Sans, bold headings with a thin rule, bordered code blocks on `#f8f8f8`. Crimson is reserved for the term or sentence that matters on a slide; everything else is body text. The writing follows the site's voice too: second person, plain words, "notice how" and "recall that" rather than jargon.

Every C$50 Finance example is taken from the Problem Set 9 specification (the `buy` rules, the `history` columns, the hints about `?` placeholders, the "Testing" list, the personal touches). The demo's `mario.c` is the CS50 classic; this year's Problem Set 1 used Seats, which the slides and notes acknowledge.

| Slides | Content | Layout |
| --- | --- | --- |
| 1–5 | Title; "Take Out Your Phone" (`AudienceQR`); the hook ("What Should You Learn Next?"); "An Inversion"; the same inversion as a picture | `cover`, `concept-viz` ×2, `two-cols-header`, `concept-viz` |
| 6, 12, 19, 27 | Part dividers | `section` |
| 7–11, 13–18, 20–26, 28–42 | Ten concepts: title → visualization(s) → explanation / Finance example / takeaway. Concepts 4 and 8 have two visualization slides | `concept-title`, `concept-viz`, `concept-detail` |
| 43–45 | Synthesis: effort table; the same as a chart; what doesn't go away | `default`, `concept-viz`, `default` |
| 46–53 | Live demo: `mario.c` → the first prompt → what kind of controller? → language and shape → the riskiest assumption (one conversation, `AgentChat`) → the spec with its evidence → the experiment (`ControllerTest`) → finish the game (`LiveDemo`) | mixed |
| 54–58 | Closing quote; the join QR again, so the room has its phones out; a breath ("Harvard Yard"); the finale: Harvard Yard and the Science Center Gym (`GymGame`, the whole slide); end: "This Was CS50" | `quote`, `concept-viz`, `section`, `default`, `end` |

Every slide carries presenter notes. On `concept-detail` slides the example appears on the first click and the takeaway on the second.

Four things to know when editing `slides.md`:

- `export: false` in a slide's frontmatter keeps it out of the PDF.

- Slidev reserves `title` in slide frontmatter (it drives the table of contents), so layouts read it from the `frontmatter` prop rather than as a direct prop.
- If you insert or remove a slide *before* one that uses `<<<` snippet imports, Slidev 53.1 can render that snippet as raw text until the dev server restarts. Restart `pnpm dev` once after reordering.
- Changes to `vite.config.ts` restart the dev server; the live demo's editor reports *write failed* until the page reloads.

### The visualizations

Each concept has a full-width visualization slide between its title and its explanation. The presenter's `→` key drives every one of them, exactly as it drives `v-click` (a component claims its steps from Slidev's clicks context via `composables/useVizSteps.ts`), so the lecture never needs a mouse. Hover and keyboard focus reveal extra detail for students exploring the deck afterwards. Each visualization has a finished state, which is what the PDF export shows.

On-slide cues about what to press ("Press → to ask") are off; the presenter notes carry them. Set `SHOW_HINTS = true` in `components/viz/config.ts` to show them again, e.g. when publishing the deck for students to click through on their own.

| Concept | Component | Steps | What the → does |
| --- | --- | --- | --- |
| Hook | `LanguageIndex` | 4 | the TIOBE chart (ratings each November 2021–2026, read from tiobe.com's per-language pages; the four CS50 languages marked); the Prompt Index slides in (`prompt_index.md`, satirical, parsed from the file so the two cannot drift); its CS50 entries; then one more line on the chart, English, not tracked by TIOBE, above Python by this year; the line |
| Hook | `InversionFlip` | 3 | this semester's chain; the new chain; where "you" moved to |
| 1 LLM | `TokenPredictor` | 6 | predicts `def quote():` a line at a time, showing the candidates each line beat |
| 2 Chatbot | `ChatSim` | 5 | one turn of the `/buy` conversation; a ledger tallies who did the work |
| 3 Tool calling | `ExecutionLoop` | 8 | one event in the `/sell` think → act → observe loop |
| 4 Harness | `HarnessRings` | 4 | labels the ring; injects `.schema`; blocks `DROP TABLE`; passes a `SELECT` |
| 4 Harness | `HarnessFiles` | 4 | a real harness as files: `AGENTS.md` and `SKILL.md` (the model reads them), `settings.json` permissions, `hooks.json`, `sandbox.json` (the harness enforces them). Formats checked against the Cursor, Claude Code and Agent Skills docs, November 2026 |
| 5 Specifications | `SpecChecks` | 6 | submits one input to `buy`; the rule that catches it lights up |
| 6 Guardrails | `Guardrails` | 4 | version 1 through the prompt and the scanner; then version 2 |
| 7 Verification | `VerifyArtifact` | 4 | tries reading 1,000 lines; then checks `/history` against the spec |
| 8 Multi-agent | `Swimlanes` | 4 | hands the "trade from `index`" feature to the next agent |
| 8 Multi-agent | `ContextStacks` | 6 | one agent's context grows through the four jobs (13 things, testing its own work); then four agents with 3 each |
| 9 Factory | `FactoryPipeline` | 6 | one Finance issue ("add cash") from issue to pull request, one stage per press |
| 10 Approval gates | `ApprovalDial` | 3 | moves the gate: everything waits, the sensible middle, the dark factory |
| Synthesis | `EffortChart` | 4 | adds an era to the stacked bars; every segment is labeled; hovering a segment or legend entry lights that category in every bar |
| Demo | `AgentChat` | 3–4 per scene | one scene of the student–agent conversation per slide (`scene="ask"`, `controller`, `design`, `risk`); each press is the next turn. Hover a choice (what controller? which language? which shape?) for its feasibility, or a dot on the risk scale for why it sits there. The script, with every claim checked against `demo/mario/`, is `viz/demoScript.ts` |
| Demo | `DemoSpec` | 7 | the game's requirements, each paired with the artifact that proves it; the last press is what was left out on purpose |

All live in `components/viz/`, share `CodeSnippet` (Shiki, via one highlighter in `highlighter.ts`) and `Tip` (hover/focus tooltip), use only the deck's design tokens, and respect `prefers-reduced-motion`.

### The live demo

The game comes up at full width with two things deliberately missing: `demo/mario/physics.ts` has an `applyGravity()` that hands the speed straight back (so a jump sends the duck out through the top of the level, with a message), and `demo/mario/level.ts` returns no rows. Both are added on stage, by the agent or by hand. Press `→` (or **Show code**) to open the code panel beside the game; it has a tab per file. Leave the panel in **Preview** so the audience sees each save morph the old code into the new.

Prompts that work:

1. "The duck flies off when I jump. Add gravity to `physics.ts`: 0.8 pixels per frame squared, with a terminal velocity of 16."
2. "Add the Week 1 pyramid to `level.ts`: eight rows, as a loop inside a loop."
3. "Make the pyramid 12 tall." / "Invert it, widest row on top." / "Make it the Mario *more* version: two half-pyramids with a 2-space gap."
4. Introduce a bug on purpose (delete a parenthesis): the game keeps the previous version and shows the error with its line and column; have the agent fix it.

If the agent fails on stage, `pnpm demo solve physics`, `pnpm demo solve level`, or `pnpm demo solve` for both copies the known-good files in. The dev server sees the write like any other save: the game, the Preview panel and an open editor all update at once, no reload. The solution files are covered by `pnpm test`, so they are known to work before you need them.

**Editing by hand.** Click **Edit**, pick a file tab. The panel becomes a Monaco editor bound two ways to the file:

- Edits autosave about half a second after you stop typing; <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>S</kbd> saves at once. The status in the title bar reads *unsaved → saving… → saved*.
- If the agent (or `pnpm demo solve`) changes the file on disk while the editor has no unsaved edits, the editor updates in place.
- If the file changes on disk while you *do* have unsaved edits, a bar asks whether to **Load the file** or **Keep mine**. Autosave stands down until you choose, so neither side silently wins; **Preview** and the other file tab are disabled until you do.
- Each file keeps its own editor once opened, so switching tabs never loses a draft. Switching to **Preview** or another tab saves any pending edit first. If a save is refused (or the dev server doesn't answer), the status reads *write failed* and the edit stays unsaved so the next keystroke or <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>S</kbd> retries it.
- Edit mode works only from the machine running `pnpm dev`, and only for these two files. With `slidev --remote`, other devices on the network still get the deck, the game, and **Preview**, but their writes are refused (*write failed*), so nobody in the room can change the game under you.
- Slide shortcuts (Space, arrows) are off while the editor has focus.

Rules: `buildLevel()` must return `string[]`; `#` is solid, anything else is air. Levels wider than 30 columns or taller than 15 rows are clipped with a HUD warning. `applyGravity(vy)` must return a number; `JUMP_VELOCITY` is optional (default −14). A runtime error or a syntax error in either file keeps the previous version and names the problem in the strip under the game; this also holds if the deck is refreshed while a file is broken.

### The room

The audience joins from their phones. A QR code on slide 2 (and again before the finale) points at `/join`, a page small enough to load on lecture-hall wifi, where they can vote or follow the slides on their own screen. Everything goes through one websocket on one small Node process, `server/`, which also serves the built deck. There is no login: a device is identified by a random id kept in `localStorage`, so one phone is one vote however often it reconnects.

**Who is the presenter.** The hub has one secret, `PRESENTER_TOKEN`. A deck that presents it in `hello` may open and close polls, publish slide position and the live demo's source, and reset the room; everything else is audience. The dev deck takes the token from `.env.local` (`VITE_PRESENTER_TOKEN`); a production build never contains it. On a hosted copy, open the deck once with `#presenter=TOKEN` (a fragment, so it never reaches the server or its logs); the token is stored in that browser and removed from the address bar (`#presenter=` forgets it). A wrong token demotes the deck to audience and the poll slides say **presenter token rejected** where they would show the headcount.

**Which window to drive from.** Polls work from either the slide view or `/presenter`. Slide position is different: under `pnpm dev` both windows publish it, but on a hosted deck Slidev publishes position only from `/presenter`, so if you ever present from the hosted copy, drive from `/presenter` or the room will not follow. A window joins the hub when it is on a slide, so one opened on `/overview` or `/entry` starts publishing the moment you click into the deck. If `__hubSync.channels.size` in the console is `0`, Slidev never registered its sync channels in that window; slide position still reaches the room by way of the router, cursor and drawings do not, and a reload fixes it.

**What the presenter can do.** The only votes in the deck are the finale's. Two more components are ready to drop into `slides.md`:

- **Poll** (`<LivePoll id question :options>`): `→` opens it on every phone, `→` again closes it. The presenter sees the bars move; the room sees them when it closes. A poll's `id` must be unique in the deck.
- **The room decides** (`<GameChoice id question :choices :seconds>`): `→` opens a timed vote. When it closes the hub names a winner (ties go to the option that got there first) and the presenter's deck writes that choice's preset over `level.ts` or `physics.ts` through the dev server, so the running game changes. Choices name files in `demo/mario/presets/` by stem: `level-*` replaces `level.ts`, `physics-*` replaces `physics.ts`. To offer something new, add a file there; `pnpm test` checks it loads.
- **Follow along.** The presenter's slide, click, laser pointer and drawings are published to the room; a phone following the deck moves with them. During the live demo the text of `level.ts` and `physics.ts` is mirrored too, so the code pane animates on phones; the game itself stays on the big screen, and a following phone shows a note where the canvas would be.
- **Messages.** The hub relays audience messages to the presenter's deck (`useHub().state.messages`), but the join page no longer offers a way to send one, to keep it to voting and following.

All of this is inert in the overview, the "next slide" preview, and `pnpm export`, and a copy of the deck with no hub reachable simply says so.

**Capacity.** `pnpm hub:loadtest` simulates the room. On a laptop, 500 phones vote with a p95 round-trip of ~10 ms and the hub grows by about 10 MB; it exits non-zero if a vote is lost or fan-out is slow, so it can gate a deploy. Every socket is rate-limited, idle sockets are pinged, and payloads are capped; the rules are in `server/hub.ts`, the plumbing in `server/app.ts`.

### The finale

`<GymGame :seconds>` is the last slide before the end. The duck walks a top-down Harvard Yard with the controller or the arrow keys and challenges the Science Center Gym. The Gym Leader's one monster, Sloppyclaude, has fourteen moves, each something an AI says while being wrong ("You're absolutely right!", "I've thoroughly tested this."), and each comes with a question from the lecture. When a question opens, the presenter's deck opens it as a timed `choice` poll so phones on `/join` and decks that follow show the answers as buttons; when the hub closes it, the winning answer decides: right, and the move has no effect while the duck's counter lands; wrong, and the move hits the duck. Ten hits win; three misses lose; the pool is sized so a battle never runs out of questions. After the battle Henry has a few parting words; after a win, David walks over for the last word and the deck fades to the final slide by itself.

With no hub connected, or when a vote closes with nobody having voted, the panel says so and the controller answers: ↑ ↓ then ✕. ✕ while a vote is open closes it early. Poll ids are `gym-1` … `gym-14`, suffixed `#2`, `#3` on a rematch so the hub does not treat them as repeats. Questions, moves and explanations live in `demo/gym/battle.ts`; NPC dialogue in `demo/gym/npcs.ts`. Both are data, and good places to start if you want to change what the room is asked.

**Controller notes.** The browser exposes a gamepad only after a button is physically pressed on it. Chrome reports the DualShock 4 with `mapping: "standard"`: Cross = button 0, D-pad = 12–15, left stick = axes 0/1. Keyboard fallback: click the game canvas, then arrows / `A` `D` to move and `Space` / `W` to jump; in the finale, arrows / `W A S D` walk and `Space` or `Enter` talks and confirms. While the canvas is focused these keys do not advance the slides.

## Project map

| Path | Purpose |
| --- | --- |
| `slides.md` | The deck. Prepared slides live here. |
| `prompt_index.md` | The satirical Prompt Index shown on the hook slide; `viz/LanguageIndex.vue` reads its table. Edit the file to change the slide. |
| `layouts/concept-title.vue` | "Bold Concept Callout" slide. Frontmatter: `concept`, `sequence`. |
| `layouts/concept-detail.vue` | Explanation (default slot), `::example::`, `::takeaway::`. Frontmatter: `concept`, `title`, optional `reveal: false`. |
| `layouts/concept-viz.vue` | Full-width visualization slide. Frontmatter: `concept` (or `kicker`), `title`, `caption`. |
| `composables/useVizSteps.ts` | Claims `n` click steps for a component and exposes the current step, so `→` drives visualizations. |
| `components/viz/` | The visualizations and their shared pieces (see above). |
| `demo/mario.c` | The classic CS50 Mario solution shown in Step 1 of the demo. |
| `demo/live.md` | **Agent-editable** slide, available for pulling in via `src:` (not in the current deck). When included, Vite HMR patches the deck in place as the agent writes to it, no reload. |
| `demo/mario/level.ts` | **Live file**: the level as rows of text. Starts empty; the solution is the `mario.c` nested loop. Save it and the level rebuilds under the duck. |
| `demo/mario/physics.ts` | **Live file**: `applyGravity(vy)` and `JUMP_VELOCITY`. Starts with no gravity (the duck flies out of the level when it jumps); the solution adds 0.8 px/frame² with a terminal velocity of 16. |
| `demo/mario/start/`, `demo/mario/solutions/` | The two known states of the live files. `pnpm demo reset` / `pnpm demo solve` copy them in; `pnpm test` checks both. |
| `scripts/demo.ts` | The `pnpm demo` command: `status`, `reset`, `solve [level\|physics]`. |
| `scripts/audit-layout.ts` | The `pnpm audit:layout` command. |
| `scripts/export-range.ts` | Which slides `pnpm export` includes: all but those with `export: false`, as a `--range` for Slidev. |
| `demo/mario/world.ts` | Pure placer: ASCII rows from `level.ts` → tile grid, bottom-aligned on the ground and centered. |
| `demo/mario/engine.ts` | Fixed-timestep 60 FPS loop, AABB tile collision, rendering; `setWorld()` and `setPhysics()` for hot swaps; reports when the duck leaves the level. |
| `demo/mario/controller.ts` | Gamepad API polling, DualShock 4 "standard" mapping, keyboard fallback. |
| `demo/mario/liveModule.ts` | Shared bookkeeping for the HMR boundaries: current value, subscribers, keep-the-previous-value-and-say-why. |
| `demo/mario/liveLevel.ts`, `livePhysics.ts` | Vite HMR boundaries for `level.ts` and `physics.ts`: validate the new module and hand it to the running engine. A file that throws or doesn't compile keeps the previous version and shows why. |
| `demo/mario/liveSource.ts` | HMR boundary for the live files' `?raw` text: one ref per file so the slide can animate the diff; also the list of files the editor may write. |
| `demo/mario/editorSync.ts` | The editor's sync bookkeeping (what was sent, what is believed to be on disk), kept pure so `tests/` can cover echo, conflict, and failed-write cases. |
| `demo/mario/presets/`, `presets.ts` | Complete `level.ts` / `physics.ts` variants the room can vote for, and the write-through that applies the winner. `pnpm test` checks each is a working live file. |
| `demo/mario/duck.ts` | The CS50 duck as a 14×14 pixel sprite: one pixel map drawn on the game canvas (`drawDuck`) and as SVG on slides (`viz/DuckSprite.vue`). |
| `demo/gym/` | The finale, framework-free like `demo/mario/`: `tiles.ts` and `areas.ts` (the Yard and the Gym interior, one character per 16 px tile), `overworld.ts` (tile-to-tile movement, talking, doors, people who wander), `npcs.ts` (who is who, how they look and what they say), `sprites.ts` and `sloppyclaude.ts` (pixel maps), `battle.ts` (the rounds as data and the battle as a pure state machine), `render.ts` (canvas drawing, the transition, the send-out). |
| `components/LiveDemo.vue` | The Step 7 slide: the game alone first; `→` or **Show code** opens the code panel beside it. |
| `components/MarioGame.vue` | Canvas game embedded in a slide; runs only while its slide is active. Shows the "ouch" when the duck leaves the level. `compact` prop for side-by-side layouts. |
| `components/LiveCode.vue`, `LiveSource.vue`, `LiveEditor.vue` | The code panel on the demo slide: file tabs and a **Preview / Edit** toggle; Preview shows a live file with Shiki Magic Move, animating each save; Edit is a Monaco editor bound two ways to one live file. |
| `components/ControllerTest.vue` | The "verify first" diagnostic: a DualShock 4 drawing (`viz/DualShock.vue`) whose buttons and sticks follow the real controller, the duck acting on the same inputs, and the event log. |
| `components/GymGame.vue` | The finale on a slide: canvas plus HTML overlays (dialogue, HP, the question and its live bars). Opens each round as a hub `choice` poll; falls back to the controller. Where it is not being played (overview, preview, PDF) it draws one frame of the Yard instead. |
| `components/AudienceQR.vue`, `LivePoll.vue`, `GameChoice.vue` | The join slide; a poll driven by `→`; a timed vote whose winner is written into the game. |
| `components/FollowControl.vue`, `AudienceChoice.vue` | What a viewer sees: the Following / Unlocked pill, and a vote as an overlay wherever they are in the deck. |
| `composables/useHub.ts` | The deck's one connection to the hub, as reactive state plus actions. |
| `composables/hubSync.ts` | Registers the hub as a Slidev sync transport, so the room follows the presenter; follow/unlock; mirrors the live files' text to viewers. |
| `composables/useLive.ts` | Whether a component is on a slide being presented (not overview, preview, or print), so hub components stay inert elsewhere. |
| `setup/main.ts`, `global-bottom.vue` | Slidev hooks: install the sync bridge; render the Follow pill and the vote overlay over every slide. |
| `server/` | The audience hub: `index.ts` (environment + listen), `app.ts` (HTTP + websocket relay, serves `dist/` and `/join`, rate limit), `hub.ts` (the session's rules, pure), `protocol.ts` (the messages, shared with the deck), `public/join.html` (the phone page), `loadtest.ts`. Its own `package.json`; `ws` is the only dependency. |
| `tests/` | Vitest: `hub.test.ts` (the rules), `server.test.ts` (the relay over real sockets), `gym.test.ts` (the battle, every answer combination), `editorSync.test.ts`, `demo.test.ts`, `presets.test.ts`, `transformError.test.ts`. |
| `vite.config.ts` | Dev-server channel that writes the two live files (and only those) for the editor, accepting writes only from this machine; the per-run session id; Vite's error overlay off in favor of the game's error strip. |
| `styles/index.css` | Design tokens (crimson, Bootstrap neutrals), bundled PT Sans, shared banner/section/table styles. |
| `pnpm-workspace.yaml` | Allows `playwright-chromium`'s install script (pnpm ≥ 10 blocks build scripts by default) so `pnpm export` works after a fresh install. |
| `.github/workflows/slides.yml` | Builds the PDF on every push to `main` and publishes it as the `latest` release. |
| `Dockerfile`, `.github/workflows/main.yml`, `.ebextensions/`, `.platform/`, `.elasticbeanstalk/` | Hosting (below). |

## Working on the deck

What to run and what to keep in mind when changing things, whether for a lecture of your own or to keep this one current.

**Checks.** `pnpm test` covers the hub's rules, the battle (every combination of right and wrong answers), the live demo's start and solution files, the presets, and the editor's sync logic; add a test when you change behaviour in any of those. After touching a slide, a layout, a style or a visualization, run the layout audit: start a second dev server with `pnpm exec slidev --port 3031`, then `pnpm audit:layout` (or a range, `pnpm audit:layout -- 3031 40-50`). It loads every slide at every click and fails if anything is clipped; a glance at a slide's final state misses clipping at earlier clicks. After changing `slides.md`, the slide table above and the slide count in the opening paragraph should still match. Before committing, `pnpm demo status` should read `start` for both live files; `pnpm demo reset` puts them back.

**Writing.** The slides and notes follow the CS50 website's voice: second person, plain words, short sentences, "notice how" and "recall that" rather than jargon. No filler, no hype. Every claim about CS50 Finance comes from the Problem Set 9 specification; every claim about a tool comes from that tool's current documentation.

**Design.** One accent color, crimson `#a51c30`, for the term or sentence that matters on a slide; everything else is body text in the Bootstrap neutrals. The tokens are in `styles/index.css`. PT Sans is bundled; no other fonts. The deck makes no network requests at runtime beyond its own hub.

**Visualizations.** Each one claims its click steps through `composables/useVizSteps.ts`, so `→` drives it like `v-click`. It has a finished state that reads well as a still image (that is what the PDF shows), respects `prefers-reduced-motion`, and keeps its on-slide hints behind `SHOW_HINTS` in `components/viz/config.ts`.

**The finale's questions** live in `demo/gym/battle.ts` as data: a move Sloppyclaude uses (something an AI says while being wrong), a question, four options, the right one, and a one-line explanation. A question should be answerable from the lecture alone, and its wrong options should be the mistakes a student would actually make. The tests check the pool is large enough that a battle never runs out.

**Code.** TypeScript throughout, no framework in `demo/`, Vue 3 with `<script setup>` in components. The hub's rules (`server/hub.ts`) do no I/O and return the messages to send, so they can be tested without sockets. Comments explain why, not what. Commit messages are short, lowercase, present tense, with a type prefix: `fix: the room follows whichever window the presenter drives from`.

**Security.** The hub runs on the public internet during lectures. Anything about its security goes through [SECURITY.md](./SECURITY.md), privately.

## Hosting

This is how the CS50 copy runs; nothing in it is needed to work on the deck.

Pushes to `main` build the deck and deploy it with the hub as one Docker container to Elastic Beanstalk (`.github/workflows/main.yml`, `Dockerfile`), where the hosted deck connects to its own origin and needs no `VITE_HUB_URL`. The workflow runs install, tests and build on every push and pull request; only `main` (or a manual run) deploys, with AWS credentials from repository secrets. The environment must stay at one instance (the room's state is in that process's memory), needs `PRESENTER_TOKEN` set as an environment property (the hub refuses to start in production without one, so a forgotten token fails the health check instead of accepting a guessable default), and its instances need a public IP (`aws:ec2:vpc AssociatePublicIpAddress=true`). `.ebextensions/hub.config` records the rest. With the EB CLI installed, `eb status`, `eb logs` and `eb printenv` work from the repo (`.elasticbeanstalk/config.yml`). When exporting the PDF for the lecture, keep `.env.local` pointed at the hosted hub so the QR code on slide 2 encodes the right address.

## License

Two licenses, in [LICENSE](./LICENSE): the code is MIT; the lecture content (the slides and notes, the Prompt Index, the spec, the finale's questions and dialogue, and the artwork) is [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), as CS50's course materials are.
