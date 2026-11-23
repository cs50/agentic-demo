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

<div class="cover-sub">
Systems, Specifications, and Autonomous Software Factories Beyond CS50
</div>

<div class="cover-meta">
CS50 · Week 10
</div>

<!--
Welcome back. You've just finished C$50 Finance and submitted your final project
proposals. Today's lecture is about what happens when writing the code itself is no
longer the hard part.
-->

---
layout: concept-viz
kicker: Before we begin
title: "Take Out Your Phone"
caption: "Leave this up while people arrive. The count is live."
---

<AudienceQR />

<!--
Up while people settle. Phones out, scan, or type the address. The page is tiny and
loads on anything. A name is optional. From here they can vote, send me a message, or
follow the slides on their own screen. Watch the count climb; when it levels off, go.
-->

---
layout: concept-viz
kicker: Before we begin
title: "What Should You Learn Next?"
caption: "Press → to open the poll, → again to close it."
---

<LivePoll
  id="learn-next"
  question="You've learned C, Python, SQL and JavaScript. Which language should you learn next?"
  :options="['Rust', 'Go', 'TypeScript', 'Something else entirely']"
/>

<!--
Press: the poll opens on every phone. Give it twenty seconds; read the room. Press: it
closes and everyone sees the bars. Don't comment on the answer yet. "Let's see what the
index says." Next slide.
-->

---
layout: concept-viz
kicker: Before we begin
title: "What Should You Learn Next?"
caption: "Four presses. Hover a line or a label."
---

<LanguageIndex />

<!--
The hook (3 min). Start dead serious, even a little dull: the TIOBE index, the chart
people put in slides about which language to learn. Seven lines, five Novembers, real
numbers (tiobe.com, pulled this month). Python on top, C second; the four CS50 languages
are marked. Let it breathe. "So: which of these should you learn next?"

Press: another index slides in, same format, different column. "Fix it" has held first
place for two years. "Still broken" is second and, analysts note, closely linked to it.
Press: the rest, with the CS50 entries: "Why didn't it work?", the only one in the top
five that asks a question; "Just give me the code", which the duck declines; "What's a
pointer?", which spikes every Week 4. The ratings are made up. The prompts are not.

Press: the second index goes away, and one more line is drawn on the first chart. It
starts near zero in 2021, bends the week ChatGPT appeared, and by this month is above
Python. It isn't a language TIOBE tracks. Every prompt on the other index was written
in it. Press: the line. English is now a programming language, and you are already
fluent. That is the inversion on the next slide.
-->

---
layout: two-cols-header
class: px-2
---

# An Inversion

::left::

<div class="pr-6">

## This semester

<v-clicks>

- Each problem set handed you a precise specification: print exactly this seating chart; render an apology if `shares` isn't a positive integer; redirect to `/` when done.
- Your job was to translate that English into C, Python, and SQL. You were, in a sense, the **compiler**.

</v-clicks>

</div>

::right::

<div class="pl-6">

## From here on

<v-clicks>

- A model can produce that code in seconds.
- So the job flips. You decide **what** to build, you write down what **correct** means, you draw the **boundaries** between pieces, and you **verify** the result.

</v-clicks>

</div>

::bottom::

<div v-click class="takeaway-banner">
Writing code is no longer the bottleneck. Formulating the problem, specifying it, and verifying the result are.
</div>

<!--
Start on the left. Every pset this term gave them an exact spec, down to the names of
form fields, and their job was translation. Then the right: once a model can do the
translation, what's left is everything the pset spec used to do for them. Land on the
banner. This is the thesis; everything else is detail.
-->

---
layout: concept-viz
kicker: The same, as a picture
title: An Inversion
caption: "Press → three times. Hover a box for what it does."
---

<InversionFlip />

<!--
Three presses. First the old chain: you were the arrow in the middle. Then the new
chain. Then the highlight: you appear three times (decide, specify, verify), and none
of them is "type the code". Leave this up while you say that sentence.
-->

---
layout: section
---

<div class="section-kicker">Part 1</div>

# The Chatbot Era

<div class="section-sub">Text in, text out</div>

---
layout: concept-title
concept: 1
sequence: The Chatbot Era
---

# Large Language Model

---
layout: concept-viz
concept: 1
title: Large Language Model
caption: "Each → predicts the next line. Hover a line to see the candidates it beat."
---

<TokenPredictor />

<!--
Five presses, one line each. Point at the probabilities: every pick is the most likely
continuation. On the third and fourth, point at the runner-up: the check the spec wants
(blank symbol, lookup returning None) was right there and lost. Sixth press: the verdict.
-->

---
layout: concept-detail
concept: 1
title: Large Language Model
---

A large language model (LLM) is a program that, given some text, predicts the **most likely next token** (i.e., word or piece of a word), over and over.

It has no intent and checks no facts. It has seen a great deal of code and prose, and it continues patterns it has seen.

::example::

- Recall `quote` in `app.py`. You type `def quote():` and a model completes it: a form that takes a `symbol`, a call to `lookup`, a template rendered with the result.
- It's right because thousands of Flask apps look like that, not because it knows what `lookup` returns.

::takeaway::

A model gives you the probable, not the correct.

<!--
Keep this concrete. When they typed `def quote():` and a model finished the route,
nothing "understood" Finance. It had seen many Flask routes shaped like that. That's
why models are so good at boilerplate and so unreliable about correctness.
-->

---
layout: concept-title
concept: 2
sequence: The Chatbot Era
---

# Chatbots and Turn-by-Turn Prompting

---
layout: concept-viz
concept: 2
title: Chatbots and Turn-by-Turn Prompting
caption: "Each → is one turn. Watch the ledger on the right."
---

<ChatSim />

<!--
Five presses. The chat is the conversation most of them had during Finance. Don't narrate
the code; narrate the ledger: by the end the model has two entries and you have seven.
That asymmetry is the concept.
-->

---
layout: concept-detail
concept: 2
title: Chatbots and Turn-by-Turn Prompting
---

A chatbot (e.g., ChatGPT) puts a conversation on top of a model. You ask, it answers, you read the answer, you ask again.

Notice who's doing the work in that loop: **you** read the code, **you** run it, **you** find the bug, **you** type the fix.

::example::

- You ask: "Write `/buy` for my Flask app."
- It comes back with a route that calls `lookup`, checks the user's cash, and inserts a row. But it forgot that `shares` must be a **positive integer**, so `-5` goes through.
- You type: "Render an apology if `shares` isn't a positive integer." And so on.

::takeaway::

The chatbot writes; you remain the debugger, the tester, and the glue.

<!--
Most of them used exactly this loop during Finance. Name each step the human performs:
reading, running, catching, re-prompting. Over the next few concepts, each of those
steps gets handed to the machine.
-->

---
layout: section
---

<div class="section-kicker">Part 2</div>

# Tool Use and the Single Agent

<div class="section-sub">The model gets a terminal</div>

---
layout: concept-title
concept: 3
sequence: Tool Use and the Single Agent
---

# Tool Calling and Execution Loops


---
layout: concept-viz
concept: 3
title: Tool Calling and Execution Loops
caption: "Each → is one event. Watch which node lights up."
---

<ExecutionLoop />

<!--
Eight presses, two trips around the loop. Narrate the phases, not the commands: it decided, it
acted, it looked. On the 500, stop: this is the moment that used to be yours. On the 302, point
at the crossed-out person. Nobody pasted anything.
-->
---
layout: concept-detail
concept: 3
title: Tool Calling and Execution Loops
---

Give the model **tools**: a shell, a file editor, a database client. Instead of printing code for you to paste, it emits a command, reads the output, and decides what to do next.

That loop, run by the model rather than by you, is what makes it an **agent**.

::example::

- You say: "Implement `/sell`."
- The agent edits `app.py`, runs `flask run`, submits the form, and gets a **500**: it queried a `shares` column that doesn't exist in the table *you* designed for `buy`.
- It runs `.schema` in `sqlite3`, fixes the query, and resubmits until it redirects to `/`.

::takeaway::

The agent closes the loop with the computer directly.

<!--
This is the step from chatbot to agent: the same loop as Concept 2, run by the machine.
Preview the demo: later tonight an agent will do exactly this with the game, including
hitting an error and reading it.
-->

---
layout: concept-title
concept: 4
sequence: Tool Use and the Single Agent
---

# The Agent Harness


---
layout: concept-viz
concept: 4
title: The Agent Harness
caption: "Four presses. Hover a ring segment for what it controls."
---

<HarnessRings />

<!--
Press once to label the ring. Then the two jobs: the schema flowing in (now the model
knows the columns rather than guessing), and DROP TABLE being stopped on the way out. Last
press: a harmless SELECT goes through. Same model all three times; the harness made the
difference.
-->

---
layout: concept-viz
concept: 4
title: "The Agent Harness, as files on disk"
caption: "Four presses: context, permissions, sandbox, then the line between them."
---

<HarnessFiles />

<!--
What a harness is, concretely. These are real file formats, current as of this
lecture: AGENTS.md and SKILL.md (the model reads them; skill libraries like pstack and
Compound Engineering's ce-* skills are collections of SKILL.md files), settings.json
permissions (deny, then ask, then allow), hooks.json, sandbox.json.

Press three times to reveal the columns; narrate each as the question at the top.
Fourth press tags every file: "model reads it" or "harness enforces it". The quote at
the bottom is from the Claude Code docs, verbatim. That line is the concept: an
instruction is something the model may follow; a permission is something it cannot
change.
-->
---
layout: concept-detail
concept: 4
title: The Agent Harness
---

The **harness** is everything around the model: which files it may touch, which commands it may run, and what it gets told about your project before it starts.

The model proposes. The harness decides what's allowed and what's visible.

::example::

- Before the agent touches `finance.db`, the harness puts the output of `.schema` into its context, so it knows `users` has `id`, `username`, `hash`, and `cash`, rather than guessing.
- And when the agent tries to `DROP TABLE users` to "start fresh," the harness stops and asks you first.

::takeaway::

How well an agent works depends as much on its harness as on its model.

<!--
Students credit or blame "the model" for everything. Separate the two. Much of the
engineering in agentic tools is in the harness: permissions, sandboxing, and what
context gets injected. The duck in their codespace is a harness too.
-->

---
layout: section
---

<div class="section-kicker">Part 3</div>

# Engineering with Agents

<div class="section-sub">Where your effort goes now</div>

---
layout: concept-title
concept: 5
sequence: Engineering with Agents
---

# Specifications and Acceptance Criteria


---
layout: concept-viz
concept: 5
title: Specifications and Acceptance Criteria
caption: "Each → submits one input. Watch which rule catches it."
---

<SpecChecks />

<!--
Five inputs from the spec's own testing list. The first passes all four rules; the rest
each trip a different one. Point out the quote under the rules: every one is a sentence
from the Finance spec. They have been reading acceptance criteria all term.
-->
---
layout: concept-detail
concept: 5
title: Specifications and Acceptance Criteria
---

Rather than dictate the code, write down what **correct** means: the inputs, the outputs, and the conditions that must always hold.

If that sounds like a problem set, it should. You've been reading specifications all semester. Now you write them.

::example::

The `buy` section of the Finance spec, as acceptance criteria:

1. `symbol` must be non-blank and must exist per `lookup`; otherwise, render an apology.
2. `shares` must be a **positive integer**; otherwise, render an apology.
3. If the user can't afford the shares at the current price, render an apology **without** completing the purchase.
4. On success, redirect to `/`.

::takeaway::

If you can't say what correct means, an agent can't build it.

<!--
Point back to the Finance spec they were handed. It already reads like this. The
difference is that now they write it and the agent implements against it. Note what
the spec deliberately leaves out: it says you needn't worry about race conditions.
A good spec is as precise about what doesn't matter as about what does.
-->

---
layout: concept-title
concept: 6
sequence: Engineering with Agents
---

# Deterministic Guardrails


---
layout: concept-viz
concept: 6
title: Deterministic Guardrails
caption: "Four presses: version 1 through both gates, then version 2."
---

<Guardrails />

<!--
Version 1 is the f-string. The prompt lets it through (press 1); the scanner stops the build
(press 2), and the injection payload appears to show why it mattered. Version 2 uses the
placeholder from the spec's hint; both gates pass. The line to say: the prompt passed both
versions.
-->
---
layout: concept-detail
concept: 6
title: Deterministic Guardrails
---

Some rules are too important to ask for politely. Enforce them with tools that can't be talked out of it: compilers, linters, type checkers, tests, `check50`.

A prompt is a request. A failing check is a **wall**.

::example::

- The Finance hints warn: use `?` placeholders in `db.execute`; do **not** build queries with f-strings or `+`, lest you invite SQL injection.
- Rather than remind the agent of that in every prompt, add a check that **fails the build** whenever a string is concatenated into a query. Now the agent can't ship it.

::takeaway::

English is a suggestion. A failing check is a boundary.

<!--
The contrast: a prompt is a request, a linter is a law. Anything that must hold should
be enforced by something that can't be persuaded. They've been living with this all
term: check50 and style50 don't negotiate.
-->

---
layout: concept-title
concept: 7
sequence: Engineering with Agents
---

# Verification Artifacts


---
layout: concept-viz
concept: 7
title: Verification Artifacts
caption: "Four presses: try the code, then try the evidence."
---

<VerifyArtifact />

<!--
Press 1: the code scrolls. Let it run for a few seconds in silence. Press 2: stop; don't
review the code. The evidence panel is the spec's own test plan. Presses 3 and 4 tick the
five things the spec requires of /history. You never opened the template.
-->
---
layout: concept-detail
concept: 7
title: Verification Artifacts
---

When an agent writes a thousand lines, you won't read them all. So don't review the code. Review the **evidence** that it works: test output, a diff of the database, a screenshot, a recording.

The question shifts from "is this code right?" to "does this proof convince me?"

::example::

- To check `history`, don't read the Jinja template.
- Run the spec's own test plan, recorded: register, buy 10 shares of NFLX, sell 4, and open `/history`. Two rows, each with the symbol, the price, the shares, and the date and time, in that order.
- If the recording shows that, `history` works, whatever the template looks like.

::takeaway::

Verification, not writing, is now the bottleneck.

<!--
Slow down here. Reading code doesn't scale; evidence does. The Finance spec's
"Testing" section is already a list of verification artifacts. Tonight's demo will
produce one before the game is ever launched.
-->

---
layout: section
---

<div class="section-kicker">Part 4</div>

# Many Agents and Software Factories

<div class="section-sub">From one agent to a pipeline</div>

---
layout: concept-title
concept: 8
sequence: Many Agents and Software Factories
---

# Multi-Agent Orchestration


---
layout: concept-viz
concept: 8
title: Multi-Agent Orchestration
caption: "Each → hands the work to the next agent."
---

<Swimlanes />

<!--
Four presses, one handoff each. Point at what each agent sees: three things, never the
whole project. The last agent tests code it did not write. Where to cut was a human
decision, the same decision as splitting a program into functions. The next slide shows
why it matters.
-->

---
layout: concept-viz
concept: 8
title: "One agent or four?"
caption: "Four presses grow one agent's context; the fifth brings in the team; the sixth is the verdict."
---

<ContextStacks />

<!--
Same four jobs. Presses 1 to 4: one agent does them in order and everything it reads and
writes piles up; by the end it is carrying thirteen things and testing its own code.
Press 5: the four agents from the previous slide, three things each. Press 6: the
verdict. The point is not that one agent cannot do it; it is that a shorter context and
fresh eyes are the same reasons we write small functions.
-->
---
layout: concept-detail
concept: 8
title: Multi-Agent Orchestration
---

Split the work across **several agents**, each with one job and only the context it needs. One agent with everything in its head gets confused, just as one function that does everything does.

Deciding where to split is your job, and it's the same skill as decomposing a program.

::example::

The spec's "personal touch": let users buy and sell from `index` itself.

- One agent reads the spec and writes down what changes: a form per row, posting to `/buy` and `/sell`.
- One agent changes `index.html` and the routes.
- One agent runs the spec's test plan, including the "unexpected usage" cases: letters, zero, negatives, decimals, more shares than the user owns.

::takeaway::

Good agent architecture looks like good software architecture.

<!--
Same principle as functions: each agent gets a clear interface and a small context.
The decomposition is a human design decision, just as in Concept 5.
-->

---
layout: concept-title
concept: 9
sequence: Many Agents and Software Factories
---

# The Software Factory


---
layout: concept-viz
concept: 9
title: The Software Factory
caption: "Each → is one stage. Hover a stage for what it is."
---

<FactoryPipeline />

<!--
Six presses from issue to pull request. The issue is one of the spec's personal touches
(let users add cash). Hover a stage for what it is. Nobody's laptop is involved until
the last box: a person files the issue, a person reviews the pull request, and the
machine does the rest.
-->
---
layout: concept-detail
concept: 9
title: The Software Factory
---

Put all of it in the cloud and connect it to your repository. An issue comes in; a sandbox spins up; agents plan, implement, and test; a **pull request** comes out, with a summary of what changed and why.

No one's laptop is involved.

::example::

- Someone files an issue: "Let users add cash to their account" (another of the spec's personal touches).
- The factory checks out the repo, adds a route and a form, writes a test that a `$500` deposit raises `cash` by exactly `500.00`, runs `check50`, and opens a PR for you to review.

::takeaway::

Software engineering splits in two: deciding what to build, and building the factory that builds it.

<!--
Connect this to the repository this deck lives in. It was built this way: issue to
branch to PR, by an agent, with a human deciding and reviewing. Point them at the git
history later; each commit says what was done and what was learned.
-->

---
layout: concept-title
concept: 10
sequence: Many Agents and Software Factories
---

# Human Approval Gates


---
layout: concept-viz
concept: 10
title: Human Approval Gates
caption: "Three presses: the gate at the top, in the middle, and gone. Hover a change for its risk."
---

<ApprovalDial />

<!--
Press 1: everything waits, you are the bottleneck. Press 2: the gate where it belongs;
low-stakes changes ship alone, anything touching passwords, sessions or money waits. Press 3:
the dark factory. Read the note aloud, slowly. Then: autonomy is a dial, and someone owns
the setting.
-->
---
layout: concept-detail
concept: 10
title: Human Approval Gates
---

Where must a person sign off, and where may the machine proceed on its own? A "dark factory" is one with no people in it at all. Most engineers think that's a mistake for anything that matters.

Drawing that line is a design decision, and someone is **accountable** for it.

::example::

- Let the factory restyle `layout.html` or fix a typo in `apology.html` on its own.
- But anything that touches `generate_password_hash`, `session`, or the `UPDATE users SET cash` in `buy` and `sell` waits for a human to read the diff and approve.

::takeaway::

The machine can do the work. You remain responsible for it.

<!--
End the concepts on responsibility. Autonomy is a dial, not a switch, and where it's
set is an engineering decision someone owns.
-->

---
layout: default
class: synthesis
---

# Where the Effort Goes

| | You interact with | The AI does | You do |
| :-- | :-- | :-- | :-- |
| **Chatbot** | A chat window | Writes snippets on request | Read, run, and patch, turn by turn |
| **Agent** | Your editor and terminal | Runs tools, edits files, iterates | Supply context, steer, review diffs |
| **Factory** | Issues and pull requests | Takes an issue to a tested PR | <span class="text-crimson">Write the spec, set the guardrails, judge the evidence</span> |

<style>
.text-crimson { color: var(--cs50-crimson); font-weight: 700; }
</style>

<!--
Read the rightmost column top to bottom: your job moves up a level each row. The
last row is the lecture in one line.
-->

---
layout: concept-viz
kicker: The same, as a picture
title: Where the Effort Goes
caption: "Each → adds an era. Hover a segment for the share."
---

<EffortChart />

<!--
Four presses, one era each. Gray is the human-compiler work; red is engineering. Left to
right, gray drains and red fills. Then the line: the red is what this course taught you to do.
The numbers are illustrative; the shape is the point.
-->

---
layout: default
---

# What Doesn't Go Away

<v-clicks>

- **Understanding.** You can't judge whether an agent's SQL or its memory management is right without knowing how databases and memory work. That's Weeks 4 and 7.
- **Design.** Deciding how to split a system into pieces that don't know too much about each other. That's every pset since Week 1.
- **Skepticism.** Writing the tests the agent didn't think of. That's the "unexpected usage" list in every spec.

</v-clicks>

<div v-click class="takeaway-banner mt-8">
<span class="label">For your final project</span>
Don't use AI to write the same project faster. Use it to build something more ambitious, and make sure you could still explain every piece of it.
</div>

<!--
Everything on this slide is something they learned this term. The point is not "CS50
was unnecessary" but "CS50 is what lets you supervise the machine." Then the final
project advice, which is also the course's academic honesty policy in one sentence:
you must understand what you submit.
-->

---
layout: section
---

<div class="section-kicker">Demonstration</div>

# From Nested Loops to a Game Controller

<div class="section-sub">Week 1's loops, played with a PlayStation controller</div>

<!--
Before this slide: controller on and paired, agent open on the other display, this
deck in presenter mode.
-->

---
layout: two-cols-header
class: demo-nostalgia
---

# Step 1 · Week 1

::left::

<div class="lede">Mario, a CS50 classic (and Seats, which you wrote, uses the same loops)</div>

<<< ./demo/mario.c#loop c

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

<div class="lede mt-4">
A loop inside a loop. Count the spaces, then the hashes.
</div>

</div>

<!--
Step 1 (1–2 min). This year's Problem Set 1 was Seats, not Mario, so say so: "Many of
you wrote a loop inside a loop in Seats to print a seating chart. The classic CS50
version prints a pyramid instead. Tonight we turn that pyramid into something you can
run and jump across, with a real controller."
-->

---
layout: concept-viz
kicker: Step 2
title: "The First Prompt"
caption: "Three presses. The agent asks before it builds."
---

<AgentChat scene="ask" />

<!--
Step 2 (2 min). The prompt is the one we'd all type. Press: the agent does not start
coding. It names the three things it cannot infer, and getting any of them wrong wastes
an hour. That is Concept 5 in one move: "simple", "Mario-style" and "a controller" are not
a specification yet. Press: it picks the controller first, because that decides what is
possible at all.
-->

---
layout: concept-viz
kicker: Step 3
title: "What Kind of Controller?"
caption: "Three presses. Hover an option to see whether the browser can read it."
---

<AgentChat scene="controller" />

<!--
Step 3 (3 min). Press: the question and the options. Let the room shout answers. Hover a
few: the PS4 and Xbox pads are the same API with a fixed layout; the steering wheel is a
gamepad without a standard mapping; the Wii Remote needs a helper program; the fork and
the spoon are not input devices unless you wire them to a Makey Makey, at which point
they are keyboard keys. The joke carries the point: the agent has to know what hardware
you actually have before it can say what is feasible. Press: our answer. Press: the
specification so far, written down.
-->

---
layout: concept-viz
kicker: Step 4
title: "Language and Shape"
caption: "Four presses. Hover a language for its cost; hover a module for what it knows."
---

<AgentChat scene="design" />

<!--
Step 4 (3 min). Press: the language options. All three can run in a browser; they differ
in cost. Python needs Pyodide and a JavaScript bridge for the controller; C needs
Emscripten and a rebuild per change. Press: we pick TypeScript, for the APIs we know and
for live reload. Press: the shape, five modules with one job each; hover one to see what
it knows and does not know. The fifth card is the one-file alternative, the shape you get
when you only say "build it". Press: we pick modules and keep the level as the Week 1
loop. These are Concepts 5 and 8 applied: say what each piece must do, and keep each
piece small.
-->

---
layout: concept-viz
kicker: Step 5
title: "The Riskiest Assumption"
caption: "Three presses. Hover a dot for why it sits where it does."
---

<AgentChat scene="risk" />

<!--
Step 5 (2 min). Press: the scale. Four of the five tasks sit at the left: a canvas, key
events, a velocity, a loop. They have done each of these in CS50. One sits at the far
right: reading a PS4 controller in a browser. A new API, Bluetooth, an unknown mapping,
and the browser does not even expose the pad until a button is pressed. This is why the
fundamentals still matter: knowing JavaScript is what lets you see that moving a sprite
is easy and the controller is not. Press: the room says it. Press: the agent's plan is
not the game but a small page that prints every event the browser sees. If it prints
"Button 0 (CROSS): DOWN", we build. If it prints nothing, nothing else matters. That is
Concept 7 before a line of game code exists.
-->

---
layout: concept-viz
kicker: The specification, written down
title: "What Must Hold, and How We Will Know"
caption: "One press per requirement. The last press is what we left out."
---

<DemoSpec />

<!--
Step 5½ (2 min). Everything the conversation settled, as acceptance criteria. Each row is a requirement
in the left column and the artifact that proves it in the middle: a line in a log, a
number on a HUD, a count of rows on a canvas. Point out that every proof is something you
look at, not code you read. Last press: what is deliberately not in the spec. Finance's
spec did the same ("You don't need to worry about race conditions").
-->

---
layout: default
transition: view-transition
---

# Step 6 · The Experiment

<div class="lede">
The small page the agent proposed. Press <b>✕</b>: the button lights up, the log says <code>Button 0 (CROSS): DOWN</code>, and the duck jumps.
</div>

<ControllerTest />

<!--
Step 6 (2 min). This is the experiment from the previous slide, not the game. Press a
button so the browser exposes the controller; the status bar turns green and names it. Move the left stick: the stick on the drawing moves and the
duck walks. Press ✕: the button lights, the log prints "Button 0 (CROSS): DOWN", and the
duck jumps. Three views of one event. Nobody has read the controller code; everybody has
seen it work. That's Concept 7, and it is rows 1 and 2 of the specification, checked.
Only now do we build the rest.

Press →: the duck shrinks and drops into the game on the next slide. (The View
Transitions API; Chrome and Safari. Elsewhere the slides just change.)
-->

---
layout: default
---

# Step 7 · Play, Then Finish It

<div class="lede">
The agent built the engine, the controller and the world. Two things are missing: nothing pulls the duck down, and there is no pyramid.
</div>

<div style="height: 370px">
  <LiveDemo />
</div>

<!--
Step 7 (5 min). The game, full width, nothing else. Pick up the controller: the duck
runs. Press ✕: it flies straight up and out of the level, and a message says why. Let
the room laugh, then ask them what is missing. They know: gravity. They wrote this
arithmetic in Week 1.

Press → (or "Show code"). The code panel opens with two files: level.ts, which returns
no rows, and physics.ts, whose applyGravity() hands the speed straight back. Nothing is
hidden; what is missing is visibly missing.

Then, with the agent, in Preview so the room sees the diff animate:
  1. "The duck flies off when I jump. Add gravity to physics.ts: 0.8 pixels per frame
     squared, with a terminal velocity of 16."  → the duck comes back down and lands.
  2. "Add the Week 1 pyramid to level.ts, eight rows, as a loop inside a loop."
     → the pyramid appears under the duck.
  3. Then the old favourites: "Make it 12 tall", "Flip it", "the Mario 'more' version",
     and break it on purpose so the error strip appears and the agent fixes it.

Or type it yourself: click Edit, pick the file tab, and change it. Edits autosave after
you stop typing; Cmd+S saves at once. If the agent writes the file while you have unsaved
edits, a bar asks whether to load theirs or keep yours.

If the agent is down or its code does not work, in a terminal:
    pnpm demo solve physics      (or: level, or no argument for both)
The solution file is copied over the live one; the game and the panel update at once,
no reload. `pnpm demo reset` puts both files back to their starting state.

If the controller isn't detected, click the canvas and use the arrow keys and space.
-->

---
layout: default
---

# Step 8 · The Room Decides

<div class="lede">
The game works. Now the specification changes, and the people changing it are the ones holding the phones.
</div>

<div class="room-decides">
  <GameChoice
    id="gravity"
    question="Where should the duck play next?"
    :seconds="20"
    :choices="[
      { label: 'Earth · gravity 0.8', preset: 'physics-earth' },
      { label: 'The Moon · a sixth of that', preset: 'physics-moon' },
      { label: 'Jupiter · two and a half times', preset: 'physics-jupiter' },
    ]"
  />
  <MarioGame compact />
</div>

<!--
Step 8 (3 min). The room has watched the agent change the game from a sentence. Now
they get to be the sentence. Press →: a twenty-second vote opens on every phone and on
every deck that is following. Read the options aloud; the bars move as they tap.

When the clock runs out the hub names the winner and the deck writes that preset over
physics.ts, the same path the agent used. The duck's next jump is on the Moon, or on
Jupiter. Pick up the controller and show it.

The point to make: nothing about the engine changed. A specification changed, the file
that held it changed, and the system kept running. That is what a boundary buys you.

The presets are files in demo/mario/presets/: level-*.ts replaces level.ts, physics-*.ts
replaces physics.ts. To offer a different menu, add a file and name it in the slide.
If the dev server isn't running, the vote still works but nothing is written; the panel
says so.
-->

---
layout: default
---

# Step 8 · The Room Decides, Again

<div class="lede">
Same question, other file.
</div>

<div class="room-decides">
  <GameChoice
    id="level"
    question="What should the duck climb?"
    :seconds="20"
    :choices="[
      { label: 'The Week 1 pyramid', preset: 'level-pyramid' },
      { label: 'Mario, more comfortable', preset: 'level-more' },
      { label: 'Towers', preset: 'level-towers' },
    ]"
  />
  <MarioGame compact />
</div>

<!--
Optional, if there is time. Press →: a second vote, this time over level.ts. The
"more comfortable" option is the two half-pyramids from the Week 1 spec, with the gap;
ask whether the duck can clear it under whatever gravity they just chose.
-->

---
layout: quote
class: text-center
---

<div class="max-w-3xl mx-auto">

> The agent wrote the rendering loop and the boilerplate. The game works because **we** drew the boundaries, **we** wrote down the physics, and **we** checked the controller before trusting it. That's the job now.

</div>

<!--
Let it sit. Then: the repository this deck lives in was built the same way, and its
git history is the receipt.
-->

---
layout: default
class: gym-slide
---

<GymGame :seconds="20" full />

<!--
The finale (8 min). Click the canvas, pick up the controller. The duck is on the path at
the bottom of the Yard; walk. Talk to whoever is standing around (✕): the student whose
agent "fixed something", the tourist at the statue, the professor who warns you about
the Gym, the tour guide at Widener. Read John Harvard's plaque (face it, ✕): three
claims, three wrong, and people still rub the shoe. The Yard is for poking around; take
a minute, no more.

Walk up the middle path to the Science Center. The glass doors are the Gym. Walking into
them reads the sign; ✕ challenges.

The battle. ✕ moves the text. Sloppyclaude uses a move; every move is a kind of AI slop:
CONFIDENT NONSENSE, INFINITE LOOP, VIBE SPEC, WORKS ON MY MACHINE, YOU'RE ABSOLUTELY
RIGHT. Each comes with a question, and the question opens on every phone as a
twenty-second vote (the same mechanism as "the room decides"). Read it aloud; watch the
bars. When the clock runs out the room's answer lands: right, and the duck's counter hits
the monster; wrong, and the slop hits the duck. The explanation shows either way, in one
line. Five rounds, ten concepts, two per round. Four right answers win.

If the room isn't connected (no hub, or nobody voted), the panel says so and the
controller picks: ↑ ↓ then ✕. ✕ while a vote is open closes it early. Keyboard works
too: arrows, Space, Enter.

Win: Sloppyclaude faints, the AI Slop Defender badge. Lose: "Come back after Week 11", and ✕
puts the duck back in the Yard for a rematch (the hub treats it as new polls).
-->

---
layout: end
---

# That's It

<div class="end-meta">The deck, the game, and how both were built: <code>github.com/cs50/agentic-demo</code></div>
