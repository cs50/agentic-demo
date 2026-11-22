# The Agentic Software Engineer — CS50 lecture deck

Interactive slide deck (Slidev) plus a playable, PS4-controller-driven Mario game embedded in the slides.
Spec: [`agentic-coding-lecture-spec.md`](./agentic-coding-lecture-spec.md).

## Run

```sh
pnpm install
pnpm dev          # http://localhost:3030  (presenter view: /presenter)
pnpm export       # writes slides-export.pdf as an offline backup
```

The deck makes no network requests at runtime: fonts (Inter, JetBrains Mono) are bundled from npm.

## Deck structure (36 slides)

| Slides | Content | Layout |
| --- | --- | --- |
| 1–2 | Title; opening hook "The CS50 Contract: An Inversion" | `cover`, `two-cols-header` |
| 3, 8, 13, 20 | Sequence dividers | `section` |
| 4–7, 9–12, 14–19, 21–26 | Ten concept pairs: title slide + explanation/Finance example/takeaway | `concept-title`, `concept-detail` |
| 27–28 | Synthesis: evolution of human effort; what remains indispensable | `default` |
| 29–35 | Live demo: `mario.c` → naive prompt → spec-driven → `test_controller` → live game → closing quote | mixed |
| 36 | End | `end` |

Every slide carries presenter notes taken from the spec's "Presenter Note" and stage directions. On `concept-detail` slides the example appears on the first click and the takeaway on the second.

## Layout

| Path | Purpose |
| --- | --- |
| `slides.md` | The deck. Prepared slides live here. |
| `layouts/concept-title.vue` | "Bold Concept Callout" slide. Frontmatter: `concept`, `sequence`. |
| `layouts/concept-detail.vue` | Explanation (default slot), `::example::`, `::takeaway::`. Frontmatter: `concept`, `title`, optional `reveal: false`. |
| `demo/mario.c` | The Week 1 solution shown in Step 1 of the demo. |
| `demo/live.md` | **Agent-editable** slides pulled in via `src:`. The agent appends here during the demo; Vite HMR patches the deck in place, no reload. |
| `demo/mario/level.ts` | **Agent-editable** level generator: Week 1's `mario.c` nested loop in TypeScript. Save it and the level rebuilds under Mario, live. |
| `demo/mario/world.ts` | Pure placer: ASCII rows from `level.ts` → tile grid, bottom-aligned on the ground and centered. |
| `demo/mario/engine.ts` | Fixed-timestep 60 FPS loop, AABB tile collision, rendering, `setWorld()` for hot level swaps. Gravity `0.8`, jump `-14`. |
| `demo/mario/controller.ts` | Gamepad API polling, DualShock 4 "standard" mapping, keyboard fallback. |
| `demo/mario/liveLevel.ts` | Vite HMR boundary for `level.ts`: rebuilds the world and notifies the running engine; keeps the previous level if the new code throws. |
| `demo/mario/liveSource.ts` | HMR boundary for `level.ts?raw`: keeps the source text in a ref so the slide can animate the diff. |
| `components/MarioGame.vue` | Canvas game embedded in a slide; runs only while its slide is active. `compact` prop for side-by-side layouts. |
| `components/LiveSource.vue` | Shows `level.ts` with Shiki Magic Move, animating each save. |
| `components/ControllerTest.vue` | The "verification first" diagnostic: live button/axis events on a slide. |
| `styles/index.css` | Palette (`#0f172a` / `#f8fafc` / `#38bdf8` / `#34d399`), bundled fonts, shared banner/section/table styles. |
| `pnpm-workspace.yaml` | Allows `playwright-chromium`'s install script (pnpm ≥ 10 blocks build scripts by default) so `pnpm export` works after a fresh install. |

## Live level editing (the demo)

On the **Step 4 · The Live Climax** slide, ask the agent to change `demo/mario/level.ts`. Prompts that work well:

1. "Make the pyramid 12 tall."
2. "Invert it, widest row on top." (a ceiling Mario can walk under)
3. "Make it the Mario *more* version: two half-pyramids with a 2-space gap."
4. "Add a second, smaller pyramid to the right."
5. Introduce a bug on purpose (e.g. `.repeat(-1)`): the game keeps the previous level and shows the error; have the agent fix it.

Rules: `buildLevel()` must return `string[]`; `#` is solid, anything else is air. Levels wider than 30 columns or taller than 15 rows are clipped with a HUD warning.

### Known caveats

- If you insert or remove a slide *before* a slide that uses `<<<` snippet imports, Slidev 53.1 can render that snippet as raw text until the dev server restarts. Finalize slide order before the lecture, or restart `pnpm dev` once after reordering.
- Slidev reserves `title` in slide frontmatter (it drives the table of contents), so layouts read it from the `frontmatter` prop rather than as a direct prop.

## Controller notes

- The browser exposes a gamepad only after a button is physically pressed on it.
- Chrome reports the DualShock 4 with `mapping: "standard"`: Cross = button 0, D-pad = 12–15, left stick = axes 0/1.
- Keyboard fallback: click the game canvas, then arrows / `A` `D` to move and `Space` / `W` to jump.
  While the canvas is focused these keys do not advance the slides.
