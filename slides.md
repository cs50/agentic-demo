---
theme: default
title: The Agentic Software Engineer
titleTemplate: '%s — CS50'
info: |
  Systems, Specifications, and Autonomous Software Factories Beyond CS50.
  Proof-of-concept deck: live-edited slides + embedded canvas game.
colorSchema: dark
transition: slide-left
aspectRatio: 16/9
canvasWidth: 980
fonts:
  sans: Inter
  mono: JetBrains Mono
drawings:
  persist: false
mdc: true
layout: cover
class: text-center
---

# The Agentic Software Engineer

<div class="text-xl text-slate-300 mt-4">
Systems, Specifications, and Autonomous Software Factories Beyond CS50
</div>

<div class="mt-16 text-sm text-slate-500">
Proof of concept · Slidev · press <kbd>→</kbd> to advance
</div>

<!--
Welcome students back. Acknowledge that they recently completed CS50 Finance and submitted
final project proposals. This lecture introduces what happens when writing syntax is no longer
the bottleneck.
-->

---
layout: two-cols
---

# Two things to prove tonight

<div class="pr-6">

## 1 · Live-edited slides

An agent edits <code>demo/live.md</code> on disk while we present.
Vite HMR patches the slide in place — **no reload, no lost position**.

</div>

::right::

<div class="pl-6 pt-14">

## 2 · A playable game inside a slide

A `<canvas>` Vue component reads the **DualShock 4** via the browser
Gamepad API. Cross jumps, left stick runs.

<div class="text-sm text-slate-400 mt-4">
Both backed by the modular architecture the spec calls for:
<code>controller.ts</code> · <code>engine.ts</code> · <code>world.ts</code>
</div>

</div>

---
src: ./demo/live.md
---

---
layout: default
---

# Verification First: `test_controller`

<div class="text-sm text-slate-400 mb-3">
Before writing a single line of game logic, prove the input layer works. Press <b class="text-emerald-400">✕ Cross</b> and watch for <code>Button 0 (CROSS): DOWN</code>.
</div>

<ControllerTest />

<!--
Stage direction (Spec, Step 3): run the diagnostic, press X, show the terminal registering
"Button 0 (CROSS): DOWN". Verification confirmed before the game is ever launched.
-->

---
layout: default
class: flex flex-col items-center
---

# From ASCII to Arcade

<MarioGame />

<style>
.slidev-layout h1 { margin-bottom: 0.4rem; }
</style>

<!--
Step 4, the live climax. Pick up the controller and guide Mario onto and over the 8-block pyramid.
If the controller isn't detected, click the canvas and use arrow keys + space as a fallback.
-->

---
layout: default
---

# Live Level Editor

<div class="text-sm text-slate-400 -mt-2 mb-3">
Ask the agent to change <code>level.ts</code>. The code morphs, the level rebuilds under Mario — no reload, no respawn.
</div>

<div class="grid grid-cols-[1.05fr_1fr] gap-4 items-start" style="height: 400px">
  <LiveSource />
  <MarioGame compact />
</div>

<!--
Prompts to try on stage, in increasing ambition:
  1. "Make the pyramid 12 tall."
  2. "Invert it — widest row on top."  (a floating ceiling; Mario walks under it)
  3. "Make it the Mario 'more' version: two half-pyramids with a 2-space gap."
  4. "Add a second, smaller pyramid 6 columns to the right."
  5. Deliberately introduce a bug (e.g. return a number) to show the red error strip:
     the previous level is kept, the HUD explains why, the agent fixes it.
-->

---
layout: default
---

# The slide shows the file on disk

<div class="text-sm text-slate-400 mb-2">
This snippet is imported from <code>demo/mario/controller.ts</code> — if the agent changes the file, the slide changes.
</div>

<<< ./demo/mario/controller.ts#ds4-buttons ts {*}{maxHeight:'400px'}

---
layout: end
---

# End of proof of concept

<div class="text-slate-400 mt-4">Next: translate the 25-slide spec into this deck.</div>
