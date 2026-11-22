# The Agentic Software Engineer — CS50 lecture deck

Interactive slide deck (Slidev) plus a playable, PS4-controller-driven Mario game embedded in the slides.
Spec: [`agentic-coding-lecture-spec.md`](./agentic-coding-lecture-spec.md).

## Run

```sh
pnpm install
pnpm dev          # http://localhost:3030  (presenter view: /presenter)
pnpm export       # writes slides-export.pdf as an offline backup
```

The deck makes no network requests at runtime: PT Sans is bundled from npm.

## Design

The deck follows the course website's look: a white page, crimson `#a51c30` as the one accent color, PT Sans, bold headings with a thin rule, bordered code blocks on `#f8f8f8`. Crimson is reserved for the term or sentence that matters on a slide; everything else is body text. The writing follows the site's voice too: second person, plain words, "notice how" and "recall that" rather than jargon.

Every C$50 Finance example is taken from the Problem Set 9 specification (the `buy` rules, the `history` columns, the hints about `?` placeholders, the "Testing" list, the personal touches). The demo's `mario.c` is the CS50 classic; this year's Problem Set 1 used Seats, which the slides and notes acknowledge.

## Deck structure (48 slides)

| Slides | Content | Layout |
| --- | --- | --- |
| 1–3 | Title; "An Inversion"; the same inversion as a picture | `cover`, `two-cols-header`, `concept-viz` |
| 4, 10, 16, 24 | Part dividers | `section` |
| 5–9, 11–15, 17–23, 25–38 | Ten concept triples: title → visualization → explanation / Finance example / takeaway | `concept-title`, `concept-viz`, `concept-detail` |
| 39–41 | Synthesis: effort table; the same as a chart; what doesn't go away | `default`, `concept-viz`, `default` |
| 42–47 | Live demo: `mario.c` → just ask → say what you mean → `test_controller` → play and change the level → closing quote | mixed |
| 48 | End | `end` |

Every slide carries presenter notes. On `concept-detail` slides the example appears on the first click and the takeaway on the second.

## Visualizations

Each concept has a full-width visualization slide between its title and its explanation. The presenter's → key drives every one of them, exactly as it drives `v-click` (a component claims its steps from Slidev's clicks context via `composables/useVizSteps.ts`), so the lecture never needs a mouse. Hover and keyboard focus reveal extra detail for students exploring the deck afterwards. Each visualization has a finished state, which is what the PDF export shows.

On-slide cues about what to press ("Press → to ask") are off; the presenter notes carry them. Set `SHOW_HINTS = true` in `components/viz/config.ts` to show them again, e.g. when publishing the deck for students to click through on their own.

| Concept | Component | Steps | What the → does |
| --- | --- | --- | --- |
| Hook | `InversionFlip` | 3 | this semester's chain; the new chain; where "you" moved to |
| 1 LLM | `TokenPredictor` | 6 | predicts `def quote():` a line at a time, showing the candidates each line beat |
| 2 Chatbot | `ChatSim` | 5 | one turn of the `/buy` conversation; a ledger tallies who did the work |
| 3 Tool calling | `ExecutionLoop` | 8 | one event in the `/sell` think → act → observe loop |
| 4 Harness | `HarnessRings` | 4 | labels the ring; injects `.schema`; blocks `DROP TABLE`; passes a `SELECT` |
| 5 Specifications | `SpecChecks` | 6 | submits one input to `buy`; the rule that catches it lights up |
| 6 Guardrails | `Guardrails` | 4 | version 1 through the prompt and the scanner; then version 2 |
| 7 Verification | `VerifyArtifact` | 4 | tries reading 1,000 lines; then checks `/history` against the spec |
| 8 Multi-agent | `Swimlanes` | 5 | hands the "trade from `index`" feature to the next agent; then one agent with everything |
| 9 Factory | `FactoryPipeline` | 6 | one stage from issue to pull request; the footer is this repository's own history |
| 10 Approval gates | `ApprovalDial` | 3 | moves the gate: everything waits, the sensible middle, the dark factory |
| Synthesis | `EffortChart` | 4 | adds an era to the stacked bars; every segment is labeled, so it reads without colour |

All live in `components/viz/`, share `CodeSnippet` (Shiki, via one highlighter in `highlighter.ts`) and `Tip` (hover/focus tooltip), use only the deck's design tokens, and respect `prefers-reduced-motion`.

## Layout

| Path | Purpose |
| --- | --- |
| `slides.md` | The deck. Prepared slides live here. |
| `layouts/concept-title.vue` | "Bold Concept Callout" slide. Frontmatter: `concept`, `sequence`. |
| `layouts/concept-detail.vue` | Explanation (default slot), `::example::`, `::takeaway::`. Frontmatter: `concept`, `title`, optional `reveal: false`. |
| `layouts/concept-viz.vue` | Full-width visualization slide. Frontmatter: `concept` (or `kicker`), `title`, `caption`. |
| `composables/useVizSteps.ts` | Claims `n` click steps for a component and exposes the current step, so → drives visualizations. |
| `components/viz/` | The twelve visualizations and their shared pieces (see above). |
| `demo/mario.c` | The classic CS50 Mario solution shown in Step 1 of the demo. |
| `demo/live.md` | **Agent-editable** slides pulled in via `src:`. The agent appends here during the demo; Vite HMR patches the deck in place, no reload. |
| `demo/mario/level.ts` | **Agent-editable** level generator: the classic `mario.c` nested loop in TypeScript. Save it and the level rebuilds under Mario, live. |
| `demo/mario/world.ts` | Pure placer: ASCII rows from `level.ts` → tile grid, bottom-aligned on the ground and centered. |
| `demo/mario/engine.ts` | Fixed-timestep 60 FPS loop, AABB tile collision, rendering, `setWorld()` for hot level swaps. Gravity `0.8`, jump `-14`. |
| `demo/mario/controller.ts` | Gamepad API polling, DualShock 4 "standard" mapping, keyboard fallback. |
| `demo/mario/liveLevel.ts` | Vite HMR boundary for `level.ts`: rebuilds the world and notifies the running engine. Keeps the previous level, and shows why, if the new code throws or doesn't compile. |
| `demo/mario/liveSource.ts` | HMR boundary for `level.ts?raw`: keeps the source text in a ref so the slide can animate the diff. |
| `components/MarioGame.vue` | Canvas game embedded in a slide; runs only while its slide is active. `compact` prop for side-by-side layouts. |
| `components/LiveCode.vue` | The code panel on the demo slide: a **Preview / Edit** toggle over the two components below. |
| `components/LiveSource.vue` | Preview: shows `level.ts` with Shiki Magic Move, animating each save. |
| `components/LiveEditor.vue` | Edit: a Monaco editor bound two ways to `level.ts`. Disk changes appear in the editor; edits autosave back to disk. |
| `demo/mario/editorSync.ts` | The editor's sync bookkeeping (what was sent, what is believed to be on disk), kept pure so `tests/` can cover echo, conflict, and failed-write cases. |
| `vite.config.ts` | Dev-server channel that writes `level.ts` (and only that file) for the editor, accepting writes only from this machine; turns off Vite's full-screen error overlay in favor of the game's error strip. |
| `components/ControllerTest.vue` | The "verification first" diagnostic: live button/axis events on a slide. |
| `styles/index.css` | Design tokens (crimson, Bootstrap neutrals), bundled PT Sans, shared banner/section/table styles. |
| `pnpm-workspace.yaml` | Allows `playwright-chromium`'s install script (pnpm ≥ 10 blocks build scripts by default) so `pnpm export` works after a fresh install. |

## Live level editing (the demo)

On the **Step 4** slide, `demo/mario/level.ts` can be changed two ways, and the level rebuilds under Mario either way, without a reload.

**With the agent.** Leave the code panel in **Preview** so the audience sees each save morph the old code into the new. Prompts that work well:

1. "Make the pyramid 12 tall."
2. "Invert it, widest row on top." (a ceiling Mario can walk under)
3. "Make it the Mario *more* version: two half-pyramids with a 2-space gap."
4. "Add a second, smaller pyramid to the right."
5. Introduce a bug on purpose (e.g. `.repeat(-1)`, or delete a parenthesis): the game keeps the previous level and shows the error; have the agent fix it.

**Yourself.** Click **Edit**. The panel becomes a Monaco editor bound two ways to the file:

- Edits autosave about half a second after you stop typing; <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>S</kbd> saves at once. The status in the panel's title bar reads *unsaved → saving… → saved*.
- If the agent (or anyone) changes the file on disk while the editor has no unsaved edits, the editor updates in place.
- If the file changes on disk while you *do* have unsaved edits, a bar asks whether to **Load the file** or **Keep mine**. Autosave stands down until you choose, so neither side silently wins; the **Preview** tab is disabled until you do.
- Switching to **Preview** saves any pending edit first. If a save is refused (or the dev server doesn't answer), the status reads *write failed* and the edit stays unsaved so the next keystroke or <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>S</kbd> retries it.
- Edit mode works only from the machine running `pnpm dev`. With `slidev --remote`, other devices on the network still get the deck, the game, and **Preview**, but their writes to `level.ts` are refused (*write failed*), so nobody in the room can change the level under you.

`pnpm test` runs the unit tests for the sync logic and the syntax-error formatter.
- Slide shortcuts (Space, arrows) are off while the editor has focus.

Rules: `buildLevel()` must return `string[]`; `#` is solid, anything else is air. Levels wider than 30 columns or taller than 15 rows are clipped with a HUD warning. A runtime error or a syntax error keeps the previous level and names the problem in the strip under the game; this also holds if the deck is refreshed while the file is broken.

### Known caveats

- If you insert or remove a slide *before* a slide that uses `<<<` snippet imports, Slidev 53.1 can render that snippet as raw text until the dev server restarts. Finalize slide order before the lecture, or restart `pnpm dev` once after reordering.
- Slidev reserves `title` in slide frontmatter (it drives the table of contents), so layouts read it from the `frontmatter` prop rather than as a direct prop.

## Controller notes

- The browser exposes a gamepad only after a button is physically pressed on it.
- Chrome reports the DualShock 4 with `mapping: "standard"`: Cross = button 0, D-pad = 12–15, left stick = axes 0/1.
- Keyboard fallback: click the game canvas, then arrows / `A` `D` to move and `Space` / `W` to jump.
  While the canvas is focused these keys do not advance the slides.
