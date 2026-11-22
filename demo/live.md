# Live Build Log

<div class="text-sm text-slate-400 mb-4">This slide is sourced from <code>demo/live.md</code>. The agent appends to it during the demo; the deck updates without reloading.</div>

- Prompt: *"Create a playable Mario game in Python with a PS4 controller."*

<!--
Step 2, the naive prompt trap. Type the vague prompt into the agent and let it work.
As the agent writes, have it log what it is doing here so the audience sees the
monolithic script taking shape. Then run it and point out the failure modes:
  - fails to initialize the joystick subsystem properly
  - hardcodes axis IDs that don't match the DualShock 4 layout
  - lacks modularity and fails silently when the controller disconnects
Key takeaway for the class: "Vague prompts produce fragile code. We must engineer
the system, not just prompt the model."
-->
