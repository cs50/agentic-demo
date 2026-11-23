# The Agentic Software Engineer — CS50 lecture deck

Interactive slide deck (Slidev) plus a playable, PS4-controller-driven platformer embedded in the slides: the CS50 duck on the Week 1 Mario pyramid.
Spec: [`agentic-coding-lecture-spec.md`](./agentic-coding-lecture-spec.md).

## Run

```sh
pnpm install
pnpm dev            # http://localhost:3030  (presenter view: /presenter)
pnpm export         # writes slides-export.pdf as an offline backup
pnpm test           # unit tests (editor sync, error messages, hub rules, presets)
pnpm audit:layout   # loads every slide at every click and reports anything cut off
pnpm hub            # the audience hub on :8080 (see "The room", below)
```

`audit:layout` needs a dev server on port 3031 (`pnpm exec slidev --port 3031`); pass another port, and optionally a slide range, as `pnpm audit:layout -- 3030 36-50`. It takes a few minutes for the whole deck and exits non-zero if any element is clipped, so it can gate a release. Run it after any layout change; a glance at a slide's final state misses clipping at earlier clicks and inside cards.

The deck makes no network requests at runtime beyond its own audience hub: PT Sans is bundled from npm, and the QR code is drawn in the browser.

## Design

The deck follows the course website's look: a white page, crimson `#a51c30` as the one accent color, PT Sans, bold headings with a thin rule, bordered code blocks on `#f8f8f8`. Crimson is reserved for the term or sentence that matters on a slide; everything else is body text. The writing follows the site's voice too: second person, plain words, "notice how" and "recall that" rather than jargon.

Every C$50 Finance example is taken from the Problem Set 9 specification (the `buy` rules, the `history` columns, the hints about `?` placeholders, the "Testing" list, the personal touches). The demo's `mario.c` is the CS50 classic; this year's Problem Set 1 used Seats, which the slides and notes acknowledge.

## Deck structure (57 slides)

| Slides | Content | Layout |
| --- | --- | --- |
| 1–5 | Title; "Take Out Your Phone" (`AudienceQR`); the hook ("What Should You Learn Next?"); "An Inversion"; the same inversion as a picture | `cover`, `concept-viz` ×2, `two-cols-header`, `concept-viz` |
| 6, 12, 19, 27 | Part dividers | `section` |
| 7–11, 13–18, 20–26, 28–42 | Ten concepts: title → visualization(s) → explanation / Finance example / takeaway. Concepts 4 and 8 have two visualization slides | `concept-title`, `concept-viz`, `concept-detail` |
| 43–45 | Synthesis: effort table; the same as a chart; what doesn't go away | `default`, `concept-viz`, `default` |
| 46–53 | Live demo: `mario.c` → the first prompt → what kind of controller? → language and shape → the riskiest assumption (one conversation, `AgentChat`) → the spec with its evidence → the experiment (`ControllerTest`) → play, then finish it (`LiveDemo`) | mixed |
| 54–57 | Closing quote; a breath ("Harvard Yard"); the finale: Harvard Yard and the Science Center Gym (`GymGame`, the whole slide); end: "This Was CS50" | `quote`, `section`, `default`, `end` |

Every slide carries presenter notes. On `concept-detail` slides the example appears on the first click and the takeaway on the second.

## Visualizations

Each concept has a full-width visualization slide between its title and its explanation. The presenter's → key drives every one of them, exactly as it drives `v-click` (a component claims its steps from Slidev's clicks context via `composables/useVizSteps.ts`), so the lecture never needs a mouse. Hover and keyboard focus reveal extra detail for students exploring the deck afterwards. Each visualization has a finished state, which is what the PDF export shows.

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

## Layout

| Path | Purpose |
| --- | --- |
| `slides.md` | The deck. Prepared slides live here. |
| `prompt_index.md` | The satirical Prompt Index shown on the hook slide; `viz/LanguageIndex.vue` reads its table. Edit the file to change the slide. |
| `layouts/concept-title.vue` | "Bold Concept Callout" slide. Frontmatter: `concept`, `sequence`. |
| `layouts/concept-detail.vue` | Explanation (default slot), `::example::`, `::takeaway::`. Frontmatter: `concept`, `title`, optional `reveal: false`. |
| `layouts/concept-viz.vue` | Full-width visualization slide. Frontmatter: `concept` (or `kicker`), `title`, `caption`. |
| `composables/useVizSteps.ts` | Claims `n` click steps for a component and exposes the current step, so → drives visualizations. |
| `components/viz/` | The twelve visualizations and their shared pieces (see above). |
| `demo/mario.c` | The classic CS50 Mario solution shown in Step 1 of the demo. |
| `demo/live.md` | **Agent-editable** slide, available for pulling in via `src:` (not in the current deck). When included, Vite HMR patches the deck in place as the agent writes to it, no reload. |
| `demo/mario/level.ts` | **Live file**: the level as rows of text. Starts empty; the solution is the `mario.c` nested loop. Save it and the level rebuilds under the duck. |
| `demo/mario/physics.ts` | **Live file**: `applyGravity(vy)` and `JUMP_VELOCITY`. Starts with no gravity (the duck flies out of the level when it jumps); the solution adds 0.8 px/frame² with a terminal velocity of 16. |
| `demo/mario/start/`, `demo/mario/solutions/` | The two known states of the live files. `pnpm demo reset` / `pnpm demo solve` copy them in; `pnpm test` checks both. |
| `scripts/demo.ts` | The `pnpm demo` command: `status`, `reset`, `solve [level\|physics]`. |
| `demo/mario/world.ts` | Pure placer: ASCII rows from `level.ts` → tile grid, bottom-aligned on the ground and centered. |
| `demo/mario/engine.ts` | Fixed-timestep 60 FPS loop, AABB tile collision, rendering; `setWorld()` and `setPhysics()` for hot swaps; reports when the duck leaves the level. |
| `demo/mario/controller.ts` | Gamepad API polling, DualShock 4 "standard" mapping, keyboard fallback. |
| `demo/mario/liveModule.ts` | Shared bookkeeping for the HMR boundaries: current value, subscribers, keep-the-previous-value-and-say-why. |
| `demo/mario/liveLevel.ts`, `livePhysics.ts` | Vite HMR boundaries for `level.ts` and `physics.ts`: validate the new module and hand it to the running engine. A file that throws or doesn't compile keeps the previous version and shows why. |
| `demo/mario/liveSource.ts` | HMR boundary for the live files' `?raw` text: one ref per file so the slide can animate the diff; also the list of files the editor may write. |
| `components/LiveDemo.vue` | The Step 7 slide: the game alone first; → or **Show code** opens the code panel beside it. |
| `components/MarioGame.vue` | Canvas game embedded in a slide; runs only while its slide is active. Shows the "ouch" when the duck leaves the level. `compact` prop for side-by-side layouts. |
| `components/LiveCode.vue` | The code panel on the demo slide: file tabs and a **Preview / Edit** toggle over the two components below. |
| `components/LiveSource.vue` | Preview: shows a live file with Shiki Magic Move, animating each save. |
| `components/LiveEditor.vue` | Edit: a Monaco editor bound two ways to one live file. Disk changes appear in the editor; edits autosave back to disk. |
| `demo/mario/editorSync.ts` | The editor's sync bookkeeping (what was sent, what is believed to be on disk), kept pure so `tests/` can cover echo, conflict, and failed-write cases. |
| `vite.config.ts` | Dev-server channel that writes the two live files (and only those) for the editor, accepting writes only from this machine; turns off Vite's full-screen error overlay in favor of the game's error strip. |
| `components/ControllerTest.vue` | The "verify first" diagnostic: a DualShock 4 drawing (`viz/DualShock.vue`) whose buttons and sticks follow the real controller, the duck acting on the same inputs, and the event log. |
| `demo/mario/duck.ts` | The CS50 duck as a 14×14 pixel sprite: one pixel map drawn on the game canvas (`drawDuck`) and as SVG on slides (`viz/DuckSprite.vue`). |
| `demo/gym/` | The finale, framework-free like `demo/mario/`: `tiles.ts` and `areas.ts` (the Yard and the Gym interior, one character per 16 px tile), `overworld.ts` (tile-to-tile movement, talking, doors, people who wander), `npcs.ts` (who is who, how they look and what they say; edit freely), `sprites.ts` and `sloppyclaude.ts` (pixel maps), `battle.ts` (the rounds as data and the battle as a pure state machine), `render.ts` (canvas drawing, the transition, the send-out). |
| `components/GymGame.vue` | The finale on a slide: canvas plus HTML overlays (dialogue, HP, the question and its live bars). Opens each round as a hub `choice` poll; falls back to the controller. |
| `styles/index.css` | Design tokens (crimson, Bootstrap neutrals), bundled PT Sans, shared banner/section/table styles. |
| `pnpm-workspace.yaml` | Allows `playwright-chromium`'s install script (pnpm ≥ 10 blocks build scripts by default) so `pnpm export` works after a fresh install. |
| `server/` | The audience hub: `index.ts` (environment + listen), `app.ts` (HTTP + websocket relay, serves `dist/` and `/join`, rate limit), `hub.ts` (the session's rules, pure), `protocol.ts` (the messages, shared with the deck), `public/join.html` (the phone page), `loadtest.ts`. Its own `package.json`; `ws` is the only dependency. `tests/hub.test.ts` covers the rules, `tests/server.test.ts` the relay over real sockets. |
| `composables/useHub.ts` | The deck's one connection to the hub, as reactive state plus actions. Presenter if a token is stored (`#presenter=TOKEN`), audience otherwise. |
| `composables/hubSync.ts` | Registers the hub as a Slidev sync transport, so the room follows the presenter; follow/unlock; mirrors the live files' text to viewers. |
| `composables/useLive.ts` | Whether a component is on a slide being presented (not overview, preview, or print), so hub components stay inert elsewhere. |
| `setup/main.ts`, `global-bottom.vue` | Slidev hooks: install the sync bridge; render the Follow pill and the vote overlay over every slide. |
| `components/AudienceQR.vue`, `LivePoll.vue`, `GameChoice.vue` | The join slide; a poll driven by →; a timed vote whose winner is written into the game. The deck uses only the join slide and the Gym's votes; the other two are available for `slides.md`. |
| `components/FollowControl.vue`, `AudienceChoice.vue` | What a viewer sees: the Following / Unlocked pill, and a vote as an overlay wherever they are in the deck. |
| `demo/mario/presets/`, `presets.ts` | Complete `level.ts` / `physics.ts` variants the room can vote for, and the write-through that applies the winner. `pnpm test` checks each is a working live file. |
| `Dockerfile`, `.github/workflows/main.yml`, `.ebextensions/`, `.platform/`, `.elasticbeanstalk/` | Hosting (see "The room"). |

## The live demo (Step 7)

The game comes up at full width with two things deliberately missing: `demo/mario/physics.ts` has an `applyGravity()` that hands the speed straight back (so a jump sends the duck out through the top of the level, with a message), and `demo/mario/level.ts` returns no rows. Both are added on stage, by the agent or by hand. Press → (or **Show code**) to open the code panel beside the game; it has a tab per file.

**Before the lecture**

```sh
pnpm demo status    # both files should read "start"
pnpm demo reset     # if they don't
pnpm test           # also checks that the start and solution files behave
```

**With the agent.** Leave the panel in **Preview** so the audience sees each save morph the old code into the new. Prompts that work:

1. "The duck flies off when I jump. Add gravity to `physics.ts`: 0.8 pixels per frame squared, with a terminal velocity of 16."
2. "Add the Week 1 pyramid to `level.ts`: eight rows, as a loop inside a loop."
3. "Make the pyramid 12 tall." / "Invert it, widest row on top." / "Make it the Mario *more* version: two half-pyramids with a 2-space gap."
4. Introduce a bug on purpose (delete a parenthesis): the game keeps the previous version and shows the error with its line and column; have the agent fix it.

**If the agent fails on stage** (outage, or code that does not work), in any terminal:

```sh
pnpm demo solve physics    # copies demo/mario/solutions/physics.ts over the live file
pnpm demo solve level      # same for level.ts
pnpm demo solve            # both
```

The dev server sees the write like any other save: the game, the Preview panel and an open editor all update at once, no reload. The solution files are covered by `pnpm test`, so they are known to work before you need them. `pnpm demo reset` puts both files back to their start state.

**Yourself.** Click **Edit**, pick a file tab. The panel becomes a Monaco editor bound two ways to the file:

- Edits autosave about half a second after you stop typing; <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>S</kbd> saves at once. The status in the title bar reads *unsaved → saving… → saved*.
- If the agent (or `pnpm demo solve`) changes the file on disk while the editor has no unsaved edits, the editor updates in place.
- If the file changes on disk while you *do* have unsaved edits, a bar asks whether to **Load the file** or **Keep mine**. Autosave stands down until you choose, so neither side silently wins; **Preview** and the other file tab are disabled until you do.
- Each file keeps its own editor once opened, so switching tabs never loses a draft. Switching to **Preview** or another tab saves any pending edit first. If a save is refused (or the dev server doesn't answer), the status reads *write failed* and the edit stays unsaved so the next keystroke or <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>S</kbd> retries it.
- Edit mode works only from the machine running `pnpm dev`, and only for these two files. With `slidev --remote`, other devices on the network still get the deck, the game, and **Preview**, but their writes are refused (*write failed*), so nobody in the room can change the game under you.
- Slide shortcuts (Space, arrows) are off while the editor has focus.

Rules: `buildLevel()` must return `string[]`; `#` is solid, anything else is air. Levels wider than 30 columns or taller than 15 rows are clipped with a HUD warning. `applyGravity(vy)` must return a number; `JUMP_VELOCITY` is optional (default −14). A runtime error or a syntax error in either file keeps the previous version and names the problem in the strip under the game; this also holds if the deck is refreshed while a file is broken.

`pnpm test` runs the unit tests: the editor's sync logic, the syntax-error formatter (esbuild and oxc shapes), and the demo's start and solution files driven through the engine.

### Known caveats

- Changes to `vite.config.ts` (the write channel) need a dev-server restart; the slide's editor will report *write failed* until then.
- If you insert or remove a slide *before* a slide that uses `<<<` snippet imports, Slidev 53.1 can render that snippet as raw text until the dev server restarts. Finalize slide order before the lecture, or restart `pnpm dev` once after reordering.
- Slidev reserves `title` in slide frontmatter (it drives the table of contents), so layouts read it from the `frontmatter` prop rather than as a direct prop.

## The room (audience hub)

The audience joins from their phones. A QR code on slide 2 points at `/join`, a page small enough to load on lecture-hall wifi, where they can vote or follow the slides on their own screen. Everything goes through one websocket on one small Node process, `server/`, which also serves the built deck. There is no login: a device is identified by a random id kept in `localStorage`, so one phone is one vote however often it reconnects.

**Running it locally**

Copy `.env.example` to `.env.local` (gitignored) and fill it in. It holds everything the laptop needs: `VITE_HUB_URL` (which hub the deck talks to; the QR slide encodes the same host) and `PRESENTER_TOKEN` (the hub's secret, with `VITE_PRESENTER_TOKEN=${PRESENTER_TOKEN}` so the dev deck is the presenter without any URL tricks). Then:

```sh
pnpm dev                                 # the deck, as presenter, against the hub in .env.local
pnpm hub                                 # optional: a local hub on :8080, using the same token
```

For a rehearsal against the hosted hub, `VITE_HUB_URL=wss://agentic.cs50.io` and the production token (`eb printenv`). For a hub on this laptop, `VITE_HUB_URL=ws://localhost:8080` and any token; phones on the same network cannot reach `localhost`, so that is for working on the deck, not the room.

`.env.local` is read by the dev server and by `pnpm hub` only; a production build never contains the token, whatever the file says. Without the file, open the deck once with `#presenter=TOKEN` (a fragment, so it never reaches the server or its logs); the token is stored in that browser and removed from the address bar (`#presenter=` forgets it). Every other copy of the deck, and every phone on `/join`, is audience.

Which window to drive from: polls and the room's votes work from either the slide view or `/presenter`. Slide position is different. Under `pnpm dev` both windows publish it; on the hosted deck, Slidev publishes position only from `/presenter`, so if you ever present from the hosted copy, drive from `/presenter` or the room will not follow. If the deck's token is rejected (stale, rotated, `.env.local` still at `change-me`), the poll slides say **presenter token rejected** where they would show the headcount, and the deck does not follow anyone.

**What the presenter can do**

The only votes in the deck are the Gym battle's (below). Two more components are ready to drop into `slides.md`:

- **Poll** (`<LivePoll id question :options>`): → opens it on every phone, → again closes it. The presenter sees the bars move; the room sees them when it closes. A poll's `id` must be unique in the deck.
- **The room decides** (`<GameChoice id question :choices :seconds>`): → opens a timed vote. When it closes the hub names a winner (ties go to the option that got there first) and the presenter's deck writes that choice's preset over `level.ts` or `physics.ts` through the dev server, so the running game changes. Choices name files in `demo/mario/presets/` by stem: `level-*` replaces `level.ts`, `physics-*` replaces `physics.ts`. To offer something new, add a file there; `pnpm test` checks it loads.
- **Follow along.** The presenter's slide, click, laser pointer and drawings are published to the room; a phone following the deck moves with them. Following is on by default. Navigating by hand unlocks (the pill in the corner reads *Unlocked*); tapping it jumps back to the presenter and follows again. During the live demo the text of `level.ts` and `physics.ts` is mirrored too, so the code pane animates on phones; the game itself stays on the big screen, and a following phone shows a note where the canvas would be.
- **Messages.** The hub still relays audience messages to the presenter's deck (`useHub().state.messages`), but the join page no longer offers a way to send one; the card was removed to keep the page to voting and following.
- **Reset** between lectures from the presenter's DevTools: `__hub.reset()` clears the poll, votes, messages and positions; connections stay. `window.__hub` exists on any deck the hub has accepted as presenter (and always under `pnpm dev`).

All of this is inert in the overview, the "next slide" preview, and `pnpm export`, and a copy of the deck with no hub reachable simply says so.

**Hosting.** Pushes to `main` build the deck and deploy it with the hub as one Docker container to Elastic Beanstalk (`.github/workflows/main.yml`, `Dockerfile`), where the hosted deck connects to its own origin and needs no `VITE_HUB_URL`. The environment must stay at one instance (the room's state is in that process's memory), needs `PRESENTER_TOKEN` set as an environment property (the hub refuses to start in production without one, so a forgotten token fails the health check instead of accepting a guessable default; locally it generates a random one and prints it), and its instances need a public IP (`aws:ec2:vpc AssociatePublicIpAddress=true`; without it they never reach the Beanstalk service and the launch times out). `.ebextensions/hub.config` records the rest. With the EB CLI installed, `eb status`, `eb logs` and `eb printenv` work from the repo (`.elasticbeanstalk/config.yml`). When exporting the PDF for the lecture, keep `.env.local` pointed at the hosted hub so the QR code on slide 2 encodes the right address.

**Capacity.** `pnpm hub:loadtest [ws://host/ws] [N]` simulates the room: N phones join, vote at once, and follow 20 slide changes and 10 live-file saves while the hub's memory is watched. On a laptop, 500 phones vote with a p95 round-trip of ~10 ms and the hub grows by about 10 MB; it exits non-zero if a vote is lost or fan-out is slow, so it can gate a deploy.

**The finale** (`<GymGame :seconds>`, the last slide before the end). The duck walks a top-down Harvard Yard with the controller or the arrow keys and challenges the Science Center Gym. The Gym Leader's one monster, Sloppyclaude, has fourteen moves, each something an AI says while being wrong ("You're absolutely right!", "I've thoroughly tested this."), and each comes with a question from the lecture. When a question opens, the presenter's deck opens it as a timed `choice` poll so phones on `/join` and decks that follow show the answers as buttons; when the hub closes it, the winning answer decides: right, and the move has no effect while the duck's counter lands; wrong, and the move hits the duck. Ten hits win; three misses lose; the pool is sized so a battle never runs out of questions. After the battle Henry has a few parting words; after a win, David walks over for the last word and the deck fades to the final slide by itself. With no hub connected, or when a vote closes with nobody having voted, the panel says so and the controller answers: ↑ ↓ then ✕. ✕ while a vote is open closes it early. Poll ids are `gym-1` … `gym-14`, suffixed `#2`, `#3` on a rematch so the hub does not treat them as repeats. Questions, moves and explanations live in `demo/gym/battle.ts`; NPC dialogue in `demo/gym/npcs.ts`.

## Controller notes

- The browser exposes a gamepad only after a button is physically pressed on it.
- Chrome reports the DualShock 4 with `mapping: "standard"`: Cross = button 0, D-pad = 12–15, left stick = axes 0/1.
- Keyboard fallback: click the game canvas, then arrows / `A` `D` to move and `Space` / `W` to jump. In the finale, arrows / `W A S D` walk and `Space` or `Enter` talks and confirms.
  While the canvas is focused these keys do not advance the slides.
