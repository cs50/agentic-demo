# The Agentic Software Engineer — CS50 lecture deck

Interactive slide deck (Slidev) plus a playable, PS4-controller-driven Mario game embedded in the slides.
Spec: [`agentic-coding-lecture-spec.md`](./agentic-coding-lecture-spec.md).

## Run

```sh
pnpm install
pnpm dev          # http://localhost:3030  (presenter view: /presenter)
pnpm export       # PDF backup (first run downloads Playwright Chromium)
```

## Layout

| Path | Purpose |
| --- | --- |
| `slides.md` | The deck. Prepared slides live here. |
| `demo/live.md` | **Agent-editable** slides pulled in via `src:`. The agent appends here during the live demo; Vite HMR patches the deck in place, no reload. |
| `demo/mario/level.ts` | **Agent-editable** level generator: Week 1's `mario.c` nested loop in TypeScript. Save it and the level rebuilds under Mario, live. |
| `demo/mario/world.ts` | Pure placer: ASCII rows from `level.ts` → tile grid, bottom-aligned on the ground and centered. |
| `demo/mario/engine.ts` | Fixed-timestep 60 FPS loop, AABB tile collision, rendering, `setWorld()` for hot level swaps. Gravity `0.8`, jump `-14`. |
| `demo/mario/controller.ts` | Gamepad API polling, DualShock 4 "standard" mapping, keyboard fallback. |
| `demo/mario/liveLevel.ts` | Vite HMR boundary for `level.ts`: rebuilds the world and notifies the running engine; keeps the previous level if the new code throws. |
| `demo/mario/liveSource.ts` | HMR boundary for `level.ts?raw`: keeps the source text in a ref so the slide can animate the diff. |
| `components/MarioGame.vue` | Canvas game embedded in a slide; runs only while its slide is active. `compact` prop for side-by-side layouts. |
| `components/LiveSource.vue` | Shows `level.ts` with Shiki Magic Move, animating each save. |
| `components/ControllerTest.vue` | The "verification first" diagnostic: live button/axis events on a slide. |
| `styles/index.css` | Palette: `#0f172a` / `#f8fafc` / `#38bdf8` / `#34d399`. |

## Live level editing (the demo)

On the **Live Level Editor** slide, ask the agent to change `demo/mario/level.ts`. Prompts that work well:

1. "Make the pyramid 12 tall."
2. "Invert it, widest row on top." (a ceiling Mario can walk under)
3. "Make it the Mario *more* version: two half-pyramids with a 2-space gap."
4. "Add a second, smaller pyramid to the right."
5. Introduce a bug on purpose (e.g. `.repeat(-1)`): the game keeps the previous level and shows the error; have the agent fix it.

Rules: `buildLevel()` must return `string[]`; `#` is solid, anything else is air. Levels wider than 30 columns or taller than 15 rows are clipped with a HUD warning.

### Known caveat

If you insert or remove a slide *before* a slide that uses `<<<` snippet imports, Slidev 53.1 can render that snippet as raw text until the dev server restarts. Finalize slide order before the lecture, or restart `pnpm dev` once after reordering.

## Controller notes

- The browser exposes a gamepad only after a button is physically pressed on it.
- Chrome reports the DualShock 4 with `mapping: "standard"`: Cross = button 0, D-pad = 12–15, left stick = axes 0/1.
- Keyboard fallback: click the game canvas, then arrows / `A` `D` to move and `Space` / `W` to jump.
  While the canvas is focused these keys do not advance the slides.
