# Step 2 · Just Ask

<div class="lede">This slide is <code>demo/live.md</code>. The agent writes to it as it works; the deck updates without a reload.</div>

- You type: *"I'd like to build a simple Mario-style game that works with a controller in the browser."*

<!--
Step 2 (2–3 min), the naive prompt. Type it into the agent and let it work. Have it log
what it's doing here so the audience sees a single long file take shape. Then run it and
point out what went wrong:
  - it picked a language, a drawing library and a controller mapping without asking
  - it hard-coded button numbers that don't match a DualShock 4
  - it's one file, and it fails silently when the controller disconnects
Takeaway for the room: "A vague request gets you fragile code. We have to engineer
the system, not just ask for it." The next slide is the decisions it made for us.
-->
