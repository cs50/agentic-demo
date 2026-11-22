# Live Build Log

<div class="text-sm text-slate-400 mb-4">This slide is sourced from <code>demo/live.md</code>. The agent edits that file; the deck updates without reloading.</div>

- Step 1 — Nostalgia anchor: Week 1 `mario.c` prints `#` pyramids
- Step 2 — Naive prompt: *"Write a Mario game with a PS4 controller"* → **monolithic script, wrong axis IDs, crashes on disconnect**
- Step 3 — Spec-driven: split into `controller.ts` · `engine.ts` · `world.ts`, verification harness **first**

```ts
// invariants the agent must satisfy
export const FPS = 60
export const GRAVITY = 0.8        // px/frame²
export const JUMP_VELOCITY = -14  // px/frame
export const PYRAMID_HEIGHT = 8   // CS50 Week 1
```

<!--
Presenter: this slide is a placeholder. During the demo the agent appends steps here.
-->

---

# Step 4 — Verification passed ✅

<div class="text-slate-300">
<code>test_controller</code> registered <b class="text-emerald-400">Button 0 (CROSS): DOWN</b>.
The input layer is proven. Now — and only now — we launch the game.
</div>
