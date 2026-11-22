# Step 2 · Just Ask

<div class="lede">This slide is <code>demo/live.md</code>. The agent writes to it as it works; the deck updates without a reload.</div>

- You type: *"Make me a Mario game in Python that works with a PS4 controller."*

<!--
Step 2 (2–3 min), the naive prompt. Type the vague prompt into the agent and let it
work. Have it log what it's doing here so the audience sees a single long file take
shape. Then run it and point out what went wrong:
  - it never initialized the joystick properly
  - it hard-coded axis numbers that don't match a DualShock 4
  - it's one file, and it fails silently when the controller disconnects
Takeaway for the room: "A vague request gets you fragile code. We have to engineer
the system, not just ask for it."
-->
