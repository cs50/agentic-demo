---
theme: default
title: The Agentic Software Engineer
titleTemplate: '%s — CS50'
info: |
  Systems, Specifications, and Autonomous Software Factories Beyond CS50.
  A CS50 lecture for students who have just finished C$50 Finance and
  submitted final project proposals.
author: CS50
colorSchema: light
transition: fade
aspectRatio: 16/9
canvasWidth: 980
fonts:
  provider: none
  sans: "'PT Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
highlighter: shiki
shiki:
  theme: github-light
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
CS50 · after Finance, before the final project
</div>

<!--
Welcome students back. Acknowledge that they recently completed CS50 Finance and
submitted final project proposals. This lecture introduces what happens when writing
syntax is no longer the bottleneck.
-->

---
layout: two-cols-header
class: px-2
---

# The CS50 Contract: An Inversion

::left::

<div class="pr-6">

## The Traditional Semester

<v-clicks>

- Problem sets handed down exact, step-by-step specifications: exact hash counts in Mario, predetermined routes and database schemas in Finance.
- Your primary job was acting as a **human compiler**, translating English requirements into C, Python, and SQL.

</v-clicks>

</div>

::right::

<div class="pl-6 border-l border-slate-700">

## The Modern Agentic Era

<v-clicks>

- AI models can generate boilerplate syntax in seconds.
- The job flips: humans **define the goal**, establish hard **acceptance criteria**, design **system boundaries**, and **verify** the outcome.

</v-clicks>

</div>

::bottom::

<div v-click class="takeaway-banner">
"Syntax is commoditized. Problem formulation, specification, and verification are now your superpowers."
</div>

<!--
The opening hook. Walk the left column first: every pset they did this semester gave
them an exact spec and their job was translation. Then the right column: with models
generating syntax in seconds, the job flips to the parts of engineering that were
previously hidden behind the pset spec. Land on the banner.
-->

---
layout: section
---

<div class="section-kicker">Sequence 1</div>

# The Chatbot Era

<div class="section-sub">Text In, Text Out</div>

---
layout: concept-title
concept: 1
sequence: The Chatbot Era
---

# Large Language Model (LLM)

---
layout: concept-detail
concept: 1
title: Large Language Model (LLM)
---

A high-dimensional statistical engine trained to predict the **most probable next token** in a sequence.

It does not possess intent or verify facts; it performs advanced pattern matching across code and natural language.

::example::

- You provide the function signature `def quote():`.
- The model predicts the most probable Flask route syntax, form parsing logic, and `lookup()` call, based on patterns in open-source Python repositories.

::takeaway::

The model operates on probability, not ground truth.

<!--
Concept 1. Keep this grounded: when they typed `def quote():` and a model completed it,
nothing "understood" Finance. It had seen thousands of Flask routes. That is why it is
so good at boilerplate and so unreliable about whether the result is correct.
-->

---
layout: concept-title
concept: 2
sequence: The Chatbot Era
---

# Chatbot Interface & Turn-by-Turn Prompting

---
layout: concept-detail
concept: 2
title: Chatbot Interface & Turn-by-Turn Prompting
---

A conversational UI (such as ChatGPT) layered over an LLM.

The developer works in a **synchronous, manual feedback loop**: prompt → inspect generated code → spot bugs → prompt again to patch the flaw.

::example::

- You ask: *"Write the `/buy` route for my Flask app."*
- The model outputs code that updates the cash balance, but **forgets to validate that `shares` is a positive integer**.
- You correct it in the next turn: *"Fix this so users cannot purchase negative shares."*

::takeaway::

The human remains the manual debugger, runtime tester, and integration glue.

<!--
Concept 2. Most students used exactly this loop during Finance. Name what the human is
doing in that loop: reading, running, catching, re-prompting. Every one of those steps
is about to be handed to the machine, one concept at a time.
-->

---
layout: section
---

<div class="section-kicker">Sequence 2</div>

# Tool Use & The Single Agent

<div class="section-sub">The model gets hands</div>

---
layout: concept-title
concept: 3
sequence: Tool Use & The Single Agent
---

# Tool Calling & Execution Loops

---
layout: concept-detail
concept: 3
title: Tool Calling & Execution Loops
---

Extending the model with **external tools**. Instead of emitting passive text for a human to copy and paste, the model outputs structured instructions to run shell commands, query databases, or execute linters.

It reads the output and **iterates autonomously** until a goal is achieved.

::example::

- You instruct the agent: *"Implement the `/sell` route."*
- The agent edits `app.py`, runs the local server, sends a test `POST`, hits an **HTTP 500** from a missing SQL column, inspects the trace, adjusts its query, and iterates until the route returns **HTTP 200 OK**.

::takeaway::

The agent forms a closed feedback loop directly with the operating environment.

<!--
Concept 3. This is the step from chatbot to agent. The loop from Concept 2 is the same,
but the machine runs it. Preview the demo: later tonight an agent will do exactly this
with the Mario game, including hitting an error and reading it.
-->

---
layout: concept-title
concept: 4
sequence: Tool Use & The Single Agent
---

# Agent Harness

---
layout: concept-detail
concept: 4
title: Agent Harness
---

The surrounding **runtime framework, security sandbox, and context coordinator**.

The harness isolates file permissions, enforces security boundaries, and injects project context into the model's environment.

::example::

- When an agent touches `finance.db`, the harness **intercepts destructive operations** (such as an accidental database reset).
- It **injects the SQLite table schemas** into context, so the agent knows exact column types instead of hallucinating them.

::takeaway::

Autonomous capability depends heavily on the robust design of the surrounding harness.

<!--
Concept 4. Students tend to credit or blame "the model" for everything. Separate the
two: the model proposes, the harness decides what it is allowed to do and what it gets
to see. Much of the engineering in agentic tools lives here, not in the model.
-->

---
layout: section
---

<div class="section-kicker">Sequence 3</div>

# Engineering with Autonomous Agents

<div class="section-sub">Where the human effort goes now</div>

---
layout: concept-title
concept: 5
sequence: Engineering with Autonomous Agents
---

# Executable Specification & Acceptance Criteria

---
layout: concept-detail
concept: 5
title: Executable Specification & Acceptance Criteria
---

Shifting human effort from dictating step-by-step implementation code to establishing **unambiguous invariants** and **functional acceptance criteria** that any correct implementation must satisfy.

::example::

Rather than dictating raw SQL, you define an invariant specification:

1. Cash balance must **never drop below 0.00**, even during concurrent transactions.
2. Share counts must be strictly **positive, non-zero integers**.
3. Invalid stock symbols must **fail gracefully before** any database transaction begins.

::takeaway::

If you cannot specify what correctness means, an agent cannot build it reliably.

<!--
Concept 5. Point back to the pset spec they were handed for Finance: it already looked
like this. The difference is that now they are the ones writing it, and the agent is the
one implementing against it.
-->

---
layout: concept-title
concept: 6
sequence: Engineering with Autonomous Agents
---

# Deterministic Guardrails

---
layout: concept-detail
concept: 6
title: Deterministic Guardrails
---

**Non-negotiable structural constraints** enforced by compilers, linters, type checkers, and security scanners.

Rather than politely asking the agent in natural language to follow best practices, automated programmatic barriers **immediately reject** non-compliant code.

::example::

- Not: *"Please avoid SQL injection vulnerabilities."*
- Instead: a security scanner in the build pipeline **blocks any commit** where SQL queries are assembled with raw string concatenation instead of parameterized queries.

::takeaway::

English prompts are soft suggestions; compilers, linters, and type checkers are hard boundaries.

<!--
Concept 6. The contrast to draw: a prompt is a request, a linter is a law. Anything that
truly must hold should be enforced by a tool that cannot be talked out of it.
-->

---
layout: concept-title
concept: 7
sequence: Engineering with Autonomous Agents
---

# Verification Artifacts

---
layout: concept-detail
concept: 7
title: Verification Artifacts
---

Objective, visual, or programmatic **proof** that an autonomous system behaves correctly.

When agents generate thousands of lines, humans cannot review every line. Instead they inspect **artifacts**: test logs, database state diffs, browser screenshots, UI recordings.

::example::

- To verify `/history`, you don't read the raw Jinja template.
- You review an **automated browser recording**: a mock user buys 10 shares of NFLX, sells 4, and both transactions render with exact timestamps and formatted currency.

::takeaway::

Verification is the primary bottleneck in autonomous software engineering.

<!--
Concept 7. This is the one to slow down on. Reading code does not scale; evidence does.
Tonight's demo will show a verification artifact (the controller test) before the game is
ever launched.
-->

---
layout: section
---

<div class="section-kicker">Sequence 4</div>

# Multi-Agent Systems & Software Factories

<div class="section-sub">From one agent to a pipeline</div>

---
layout: concept-title
concept: 8
sequence: Multi-Agent Systems & Software Factories
---

# Multi-Agent Orchestration

---
layout: concept-detail
concept: 8
title: Multi-Agent Orchestration
---

Dividing complex development across **specialized, cooperating agents** with isolated responsibilities and decoupled state.

This avoids the memory bloat and confusion of a single monolithic prompt.

::example::

Feature request: *"Add a portfolio breakdown pie chart."*

- **Spec Agent** analyzes the request and defines the schema.
- **Backend Agent** implements the `/chart-data` JSON endpoint in Flask.
- **Frontend Agent** embeds the charting library into `index.html`.
- **QA Agent** runs end-to-end tests across mobile and desktop viewports.

::takeaway::

Modularity in agent architecture mirrors modularity in sound software engineering.

<!--
Concept 8. Same principle as decomposing a program into functions: each agent gets a
clear interface and a small context. Note that the decomposition is a human design
decision, just like in Concept 5.
-->

---
layout: concept-title
concept: 9
sequence: Multi-Agent Systems & Software Factories
---

# Software Factory

---
layout: concept-detail
concept: 9
title: Software Factory
---

An automated, cloud-hosted engineering environment covering the **complete software lifecycle**.

It ingests issues, provisions ephemeral sandboxes, coordinates specialized agents, runs automated test suites, and opens **production-ready pull requests** with zero local setup.

::example::

Issue filed: *"Support limit orders that execute when a stock hits a target price."*

- The factory provisions a cloud sandbox, applies database migrations, builds the background order worker, runs stress tests, and submits a **GitHub pull request** summarizing the architectural changes.

::takeaway::

Software engineering bifurcates into product design (what to build) and factory engineering (building the harness and pipelines).

<!--
Concept 9. Connect to the repository this deck lives in: it was built this way, issue
to PR. Point students at the git history later; each commit explains what the agent did
and what the human decided.
-->

---
layout: concept-title
concept: 10
sequence: Multi-Agent Systems & Software Factories
---

# Human Approval Gates & The "Dark Factory" Debate

---
layout: concept-detail
concept: 10
title: Human Approval Gates & The "Dark Factory" Debate
---

The architectural boundary determining **where human judgment must sign off** versus where autonomous execution is permitted.

A "Dark Factory" operates completely lights-out, with no human intervention. Industry consensus maintains that critical boundaries require strict human approval gates.

::example::

- The factory autonomously writes, tests, and deploys **CSS tweaks and layout improvements** to staging.
- An explicit **Human Approval Gate** halts the pipeline before any change touching **password hashing, session cookies, or balance deduction** reaches production.

::takeaway::

Humans remain solely accountable for system security, ethics, and reliability.

<!--
Concept 10. End the concept sequence on responsibility. Autonomy is a dial, not a switch,
and where it is set is an engineering decision someone is accountable for.
-->

---
layout: default
class: synthesis
---

# The Evolution of Human Effort

| Era | Primary interface | What AI does | Where human effort goes |
| :-- | :-- | :-- | :-- |
| **Chatbot** | Text chat window (ChatGPT) | Generates code snippets on demand | Manually reading and patching code turn-by-turn |
| **Agent / IDE** | Editor & terminal harness | Executes tools, edits files, iterates | Crafting prompt context, guiding task steps, reviewing local diffs |
| **Software Factory** | Cloud orchestrator & CI/CD | Full-lifecycle autonomous PR generation | <span class="text-emerald-400 font-bold">Designing specifications, configuring deterministic guardrails, inspecting verification artifacts</span> |

<!--
Synthesis 1. Read the rightmost column top to bottom: the human's job moves up the
abstraction ladder. The bolded row is the thesis of the lecture.
-->

---
layout: default
---

# What Remains Indispensable Beyond CS50

<v-clicks>

- **Computational intuition.** You cannot evaluate whether an agent's SQL transaction or memory allocation is correct without understanding ACID properties, pointers, and time complexity.
- **Architectural taste.** Knowing how to decompose large systems into clean, decoupled interfaces.
- **Skeptical verification.** Designing ruthless testing harnesses and anticipating the edge cases that models overlook.

</v-clicks>

<div v-click class="takeaway-banner mt-8">
<span class="text-cyan-400 font-bold uppercase tracking-widest text-xs mr-3">Final project advice</span>
Don't just use AI to write code faster. Use agents to build more ambitious, reliable systems, while maintaining complete mastery over your architecture.
</div>

<!--
Synthesis 2. Everything on this slide is something they learned this semester. The
lecture is not "CS50 was unnecessary", it is "CS50 is what lets you supervise the
machine." Then the final-project advice.
-->

---
layout: section
---

<div class="section-kicker">Live demonstration</div>

# From ASCII Pyramids to a Hardware-Controlled Arcade Game

<div class="section-sub">CS50 Mario, Week 1 → tonight</div>

<!--
Stage setup check before this slide: controller on and paired, agent CLI/editor open
on the second display, this deck in presenter mode.
-->

---
layout: two-cols-header
class: demo-nostalgia
---

# Step 1 · The Nostalgia Anchor

::left::

<div class="text-sm text-slate-400 mb-2">Week 1, <code>mario.c</code></div>

<<< ./demo/mario.c c {15-26}{maxHeight:'330px'}

::right::

<div class="pl-6 pt-7">

```text
Height: 8
       #
      ##
     ###
    ####
   #####
  ######
 #######
########
```

<div class="text-slate-400 text-sm mt-4">
Nested loops. Count the spaces, count the hashes.
</div>

</div>

<!--
Step 1 (1–2 min). Display the original mario.c solution. "In Week 1, your challenge was
figuring out how many spaces and hashes to print per row using nested loops in C. Today,
we're going to turn that very pyramid into a real-time, playable game driven by a
physical PS4 controller."
-->

---
src: ./demo/live.md
---

---
layout: default
---

# Step 3 · Spec-Driven Delegation

<div class="grid grid-cols-2 gap-6 mt-2">
<div>

### Modular architecture

<v-clicks>

- `controller.ts` — encapsulates gamepad polling; normalizes DualShock 4 buttons (**Cross** = jump, **left stick / D-pad** = move)
- `engine.ts` — 60 FPS game loop, tile collision, physics constants (gravity `0.8 px/frame²`, jump `-14 px/frame`)
- `level.ts` + `world.ts` — generate the exact 8-step CS50 pyramid on a tile grid

</v-clicks>

</div>
<div>

### Verification harness first

<v-clicks>

- Request `test_controller` **before** any game logic: a diagnostic that prints real-time axis values and button events.
- Run it on stage, press **✕**, and watch for `Button 0 (CROSS): DOWN`.
- Only once that is confirmed do we launch the game.

</v-clicks>

</div>
</div>

<!--
Step 3 (4–5 min). Pass the explicit architectural specification to the agent. Contrast
with Step 2: same goal, but now we hand over module boundaries, numeric invariants, and
a verification step. The next slide is the verification artifact.
-->

---
layout: default
---

# Verification First: `test_controller`

<div class="text-sm text-slate-400 mb-3">
Press <b class="text-emerald-400">✕ Cross</b> and watch for <code>Button 0 (CROSS): DOWN</code>.
</div>

<ControllerTest />

<!--
Run the diagnostic, press X, show the terminal registering "Button 0 (CROSS): DOWN".
Verification confirmed. This is Concept 7 made physical: nobody read the controller
code; everybody saw the evidence.
-->

---
layout: default
---

# Step 4 · The Live Climax

<div class="text-sm text-slate-400 -mt-2 mb-3">
Ask the agent to change <code>level.ts</code>. The code morphs, the level rebuilds under Mario — no reload, no respawn.
</div>

<div class="grid grid-cols-[1.05fr_1fr] gap-4 items-start" style="height: 400px">
  <LiveSource />
  <MarioGame compact />
</div>

<!--
Step 4 (2 min). Launch the assembled game. Pick up the controller and guide Mario onto
and over the 8-block pyramid.

Then, with the game running, ask the agent to change level.ts. Prompts in increasing
ambition:
  1. "Make the pyramid 12 tall."
  2. "Invert it — widest row on top."
  3. "Make it the Mario 'more' version: two half-pyramids with a 2-space gap."
  4. "Add a second, smaller pyramid to the right."
  5. Deliberately introduce a bug to show the error strip: the previous level is kept,
     the HUD explains why, and the agent reads the error and fixes it (Concept 3, live).

If the controller isn't detected, click the canvas and use arrow keys + space.
-->

---
layout: quote
class: text-center
---

<div class="max-w-3xl mx-auto">

> "The agent wrote the boilerplate and rendering loops. But this game worked because **we** designed the modular boundaries, specified the physics constraints, and built a verification step. That is the essence of modern software engineering."

</div>

<!--
Concluding quote. Let it sit. Then: the repository this deck lives in was built the same
way, and its git history is the receipt.
-->

---
layout: end
---

# Thank you

<div class="text-slate-400 mt-4">This deck, the game, and its history: <code>github.com/cs50/agentic-demo</code></div>
