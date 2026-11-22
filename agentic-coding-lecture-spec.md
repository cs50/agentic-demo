# Lecture Specification: The Agentic Software Engineer
**Subtitle:** System Design, Specifications, and Autonomous Software Factories Beyond CS50  
**Audience:** CS50 Students (Post-Finance Pset, Final Project Proposal Phase)  
**Target Deliverable:** Interactive Slide Presentation & Live Demonstration Blueprint

---

## Presentation Metadata & Design Guidelines
- **Theme:** High-contrast dark theme (navy/slate background `#0f172a`, crisp white `#f8fafc`, cyan `#38bdf8`, and emerald `#34d399` accents).
- **Format:** Minimalist slides focused on one big idea per slide.
- **Structure:** 
  - 2 Framing Slides (Opening hook & inverted problem set)
  - 20 Core Concept Slides (10 pairs: Concept Title slide + Explanation & CS50 Finance Example slide)
  - 2 Synthesis Slides (The evolution of human effort table & essential human skills)
  - 1 Live Demonstration Guide (Mario PS4 Controller live-build)
- **Anchors:** 
  - Theory: Every concept is grounded in **CS50 Finance** (`app.py`, `finance.db`, `/buy`, `/sell`, `/history`, Jinja templates).
  - Practice: The live demo levels up **CS50 Mario** from Week 1 ASCII pyramids into a playable arcade game with a physical PS4 controller.

---

## Slide-by-Slide Content Specification

### Slide 01: Title Slide
- **Layout:** Centered Hero Title
- **Headline:** The Agentic Software Engineer
- **Sub-headline:** Systems, Specifications, and Autonomous Software Factories Beyond CS50
- **Presenter Note:** Welcome students back. Acknowledge that they recently completed CS50 Finance and submitted final project proposals. This lecture introduces what happens when writing syntax is no longer the bottleneck.

---

### Slide 02: The Opening Hook — Flipping the Problem Set
- **Layout:** Two-Column Comparison
- **Headline:** The CS50 Contract: An Inversion
- **Left Column — The Traditional Semester:**
  - Problem sets handed down exact, step-by-step specifications (e.g., exact hash counts in Mario, predetermined routes and database schemas in Finance).
  - The student's primary job was acting as a human compiler—translating English requirements into C, Python, and SQL.
- **Right Column — The Modern Agentic Era:**
  - AI models can generate boilerplate syntax in seconds.
  - The job flips: humans define the goal, establish hard acceptance criteria, design system boundaries, and verify the outcome.
- **Key Takeaway Banner:** "Syntax is commoditized. Problem formulation, specification, and verification are now your superpowers."

---

### Sequence 1: The Chatbot Era (Text In, Text Out)

#### Slide 03: Concept 1 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 01
- **Title:** Large Language Model (LLM)

#### Slide 04: Concept 1 Explanation & Example
- **Concept:** Large Language Model (LLM)
- **Explanation:** A high-dimensional statistical engine trained to predict the most probable next token in a sequence. It does not possess intent or verify facts; it performs advanced pattern matching across code and natural language.
- **CS50 Finance Example:**
  - You provide the function signature `def quote():`.
  - The model predicts the most probable Flask route syntax, form parsing logic, and `lookup()` call based on patterns in open-source Python repositories.
- **Core Takeaway:** The model operates on probability, not ground truth.

---

#### Slide 05: Concept 2 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 02
- **Title:** Chatbot Interface & Turn-by-Turn Prompting

#### Slide 06: Concept 2 Explanation & Example
- **Concept:** Chatbot Interface & Turn-by-Turn Prompting
- **Explanation:** A conversational UI (such as ChatGPT) layered over an LLM. The developer interacts through a synchronous, manual feedback loop: prompt -> inspect generated code -> spot bugs -> prompt again to patch the flaw.
- **CS50 Finance Example:**
  - You ask the chatbot: "Write the `/buy` route for my Flask app."
  - The model outputs code that updates cash balance, but forgets to validate that shares is a positive integer.
  - You manually correct it in the next turn: "Fix this so users cannot purchase negative shares."
- **Core Takeaway:** The human remains the manual debugger, runtime tester, and integration glue.

---

### Sequence 2: Tool Use & The Single Agent

#### Slide 07: Concept 3 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 03
- **Title:** Tool Calling & Execution Loops

#### Slide 08: Concept 3 Explanation & Example
- **Concept:** Tool Calling & Execution Loops
- **Explanation:** Extending the model with external tools. Instead of emitting passive text for a human to copy and paste, the model outputs structured instructions to run shell commands, query databases, or execute linters, reading the output and iterating autonomously until a goal is achieved.
- **CS50 Finance Example:**
  - You instruct the agent: "Implement the `/sell` route."
  - The agent edits `app.py`, runs the local server, sends a test POST request, encounters an HTTP 500 error due to a missing SQL column, inspects the error trace, adjusts its query, and iterates until the route returns HTTP 200 OK.
- **Core Takeaway:** The agent forms a closed feedback loop directly with the operating environment.

---

#### Slide 09: Concept 4 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 04
- **Title:** Agent Harness

#### Slide 10: Concept 4 Explanation & Example
- **Concept:** Agent Harness
- **Explanation:** The surrounding runtime framework, security sandbox, and contextual memory coordinator. The harness isolates file permissions, enforces security boundaries, and injects project context into the model's environment.
- **CS50 Finance Example:**
  - When an agent interacts with `finance.db`, the harness intercepts destructive operations (such as accidental database resets) and automatically injects SQLite table schemas into context so the agent knows exact column types without hallucinating.
- **Core Takeaway:** Autonomous capability depends heavily on the robust design of the surrounding harness.

---

### Sequence 3: Engineering with Autonomous Agents

#### Slide 11: Concept 5 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 05
- **Title:** Executable Specification & Acceptance Criteria

#### Slide 12: Concept 5 Explanation & Example
- **Concept:** Executable Specification & Acceptance Criteria
- **Explanation:** Shifting human effort from dictating step-by-step implementation code to establishing unambiguous invariants and functional acceptance criteria that any correct implementation must satisfy.
- **CS50 Finance Example:**
  - Rather than dictating raw SQL syntax, you define an invariant specification:
    1. Cash balance must never drop below 0.00 during concurrent transactions.
    2. Share counts must strictly be positive non-zero integers.
    3. Invalid stock symbols must fail gracefully before any database transaction begins.
- **Core Takeaway:** If you cannot specify what correctness means, an agent cannot build it reliably.

---

#### Slide 13: Concept 6 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 06
- **Title:** Deterministic Guardrails

#### Slide 14: Concept 6 Explanation & Example
- **Concept:** Deterministic Guardrails
- **Explanation:** Non-negotiable structural constraints enforced by compilers, linters, type checkers, and security scanners. Rather than politely asking the agent in natural language to follow best practices, automated programmatic barriers immediately reject non-compliant code.
- **CS50 Finance Example:**
  - Rather than prompting "Please avoid SQL injection vulnerabilities," you configure an automated security scanner in your build pipeline that blocks any commit where SQL queries are assembled using raw string concatenation instead of parameterized queries.
- **Core Takeaway:** English prompts are soft suggestions; compilers, linters, and type checkers are hard boundaries.

---

#### Slide 15: Concept 7 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 07
- **Title:** Verification Artifacts

#### Slide 16: Concept 7 Explanation & Example
- **Concept:** Verification Artifacts
- **Explanation:** Objective, visual, or programmatic proof that an autonomous system behaves correctly. When agents generate thousands of lines of code, humans cannot review every line; instead, they inspect verification artifacts (test logs, database state diffs, browser screenshots, UI recordings).
- **CS50 Finance Example:**
  - To verify the `/history` implementation, you don't read the raw Jinja template. You review an automated browser test recording showing a mock user buying 10 shares of NFLX, selling 4 shares, and confirming that both transactions render with exact timestamps and formatted currency values.
- **Core Takeaway:** Verification is the primary bottleneck in autonomous software engineering.

---

### Sequence 4: Multi-Agent Systems & Software Factories

#### Slide 17: Concept 8 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 08
- **Title:** Multi-Agent Orchestration

#### Slide 18: Concept 8 Explanation & Example
- **Concept:** Multi-Agent Orchestration
- **Explanation:** Dividing complex software development across specialized, cooperating agents with isolated responsibilities and decoupled state, avoiding the memory bloat and confusion of a single monolithic prompt.
- **CS50 Finance Example:**
  - **Spec Agent:** Analyzes a feature request ("Add a portfolio breakdown pie chart") and defines the schema.
  - **Backend Agent:** Implements the `/chart-data` JSON endpoint in Flask.
  - **Frontend Agent:** Embeds the charting library into `index.html`.
  - **QA Agent:** Executes end-to-end tests across mobile and desktop screen viewports.
- **Core Takeaway:** Modularity in agent architecture mirrors modularity in sound software engineering.

---

#### Slide 19: Concept 9 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 09
- **Title:** Software Factory

#### Slide 20: Concept 9 Explanation & Example
- **Concept:** Software Factory
- **Explanation:** An automated, cloud-hosted engineering environment covering the complete software lifecycle. It ingests issues, provisions ephemeral sandboxes, coordinates specialized agents, runs automated test suites, and opens production-ready Pull Requests with zero local setup.
- **CS50 Finance Example:**
  - A feature request is filed: "Support limit orders that execute when a stock hits a target price."
  - The software factory provisions a cloud sandbox, applies database migrations, builds the background order worker, runs stress tests, and submits a GitHub Pull Request with a summary of architectural changes.
- **Core Takeaway:** Software engineering bifurcates into product design (what to build) and factory engineering (building the harness and pipelines).

---

#### Slide 21: Concept 10 Title
- **Layout:** Bold Concept Callout
- **Header:** Concept 10
- **Title:** Human Approval Gates & The "Dark Factory" Debate

#### Slide 22: Concept 10 Explanation & Example
- **Concept:** Human Approval Gates & The "Dark Factory" Debate
- **Explanation:** The architectural boundary determining where human judgment must sign off versus where autonomous execution is permitted. A "Dark Factory" operates completely lights-out without human intervention; industry consensus maintains that critical boundaries require strict human approval gates.
- **CS50 Finance Example:**
  - The software factory autonomously writes, tests, and deploys CSS tweaks and UI layout improvements to staging.
  - However, an explicit Human Approval Gate halts the deployment pipeline, requiring an engineer's manual approval before any change modifying password hashing, session cookies, or balance deduction touches production.
- **Core Takeaway:** Humans remain solely accountable for system security, ethics, and reliability.

---

### Slide 23: Synthesis — The Evolution of Human Effort

| Era | Primary Interface | What AI Does | Where Human Effort Goes |
| :--- | :--- | :--- | :--- |
| **Chatbot** | Text chat window (ChatGPT) | Generates code snippets on demand | Manually reading and patching code turn-by-turn |
| **Agent / IDE** | Editor & terminal harness | Executes tools, edits files, iterates | Crafting prompt context, guiding task steps, reviewing local diffs |
| **Software Factory** | Cloud orchestrator & CI/CD | Full-lifecycle autonomous PR generation | **Designing specifications, configuring deterministic guardrails, inspecting verification artifacts** |

---

### Slide 24: What Remains Indispensable Beyond CS50
- **Computational Intuition:** You cannot evaluate whether an agent's SQL transaction or memory allocation is correct without understanding ACID properties, pointers, and time complexity.
- **Architectural Taste:** Knowing how to decompose large systems into clean, decoupled interfaces.
- **Skeptical Verification:** Designing ruthless testing harnesses and anticipating edge cases that AI models overlook.
- **Final Project Advice:** Don't just use AI to write code faster; use agents to build more ambitious, reliable systems while maintaining complete mastery over your architecture.

---

## Live Demonstration Blueprint: Mario Evolution
**Title:** From ASCII Pyramids to Hardware-Controlled Arcade Game  
**Hardware:** PlayStation 4 (DualShock 4) Controller connected via USB/Bluetooth  
**Stack:** Python 3 + `pygame.joystick` + `pygame.display`

```
+-----------------------------------------------------------------------------+
|                          MARIO DEMO WORKFLOW                                |
|                                                                             |
|  [Step 1: The Nostalgia Anchor]                                             |
|  Display Week 1 CS50 Mario (Nested C loops printing '#' in terminal)        |
|        │                                                                    |
|        ▼                                                                    |
|  [Step 2: The Naive Prompt Trap]                                            |
|  Prompt: "Write a Mario game in Python with a PS4 controller"               |
|  Failure: Brittle monolithic script, incorrect joystick axes, crashes       |
|        │                                                                    |
|        ▼                                                                    |
|  [Step 3: Spec-Driven Agentic Engineering]                                  |
|  1. Architecture: Modular separation (controller.py vs game.py)             |
|  2. Concrete Invariants: 60 FPS, 8-block pyramid height, exact physics      |
|  3. Verification First: test_controller.py prints button/axis events        |
|        │                                                                    |
|        ▼                                                                    |
|  [Step 4: Live Execution on Stage]                                          |
|  Run the verified game, pick up PS4 controller, run and jump over pyramid!  |
+-----------------------------------------------------------------------------+
```

### Demonstration Script & Stage Direction

#### Step 1: The Nostalgia Anchor (1–2 minutes)
- Display the original `mario.c` solution on the main screen.
- Remind students: *"In Week 1, your challenge was figuring out how many spaces and hashes to print per row using nested loops in C. Today, we're going to turn that very pyramid into a real-time, playable game driven by a physical PS4 controller."*

#### Step 2: Demonstrating the Naive Prompt Trap (2–3 minutes)
- Open an agent CLI/editor and type: *"Create a playable Mario game in Python with a PS4 controller."*
- Show students the resulting monolithic 200-line script.
- Execute it and point out the typical failure modes:
  - Fails to initialize joystick subsystem properly.
  - Hardcodes axis IDs that don't match the DualShock 4 layout.
  - Lacks modularity and fails silently when the controller disconnects.
- Key takeaway for class: *"Vague prompts produce fragile code. We must engineer the system, not just prompt the model."*

#### Step 3: Spec-Driven Delegation (4–5 minutes)
- Pass an explicit architectural specification to the agent:
  1. **Modular Architecture:**
     - `controller.py`: Encapsulates `pygame.joystick` polling; normalizes DualShock 4 buttons (`Cross` for Jump, `Left Stick / D-Pad` for horizontal movement).
     - `engine.py`: Encapsulates the 60 FPS game loop, tile collision, and physics constants (gravity: `0.8 px/frame^2`, jump velocity: `-14 px/frame`).
     - `mario_world.py`: Generates the exact 8-step CS50 pyramid using a standard tile coordinate grid.
  2. **Verification Harness First:**
     - Request `test_controller.py`: A diagnostic tool that prints real-time axis coordinates and button down events to stdout.
- Execute `test_controller.py` on stage, press the **X** button, and show the terminal registering `Button 0 (CROSS): DOWN`. Verification confirmed.

#### Step 4: The Live Climax (2 minutes)
- Launch the assembled game.
- Pick up the PS4 controller and guide Mario across the screen, jumping onto and over the 8-block pyramid.
- Concluding quote:
  > *"The agent wrote the boilerplate and rendering loops. But this game worked because we designed the modular boundaries, specified the physics constraints, and built a verification step. That is the essence of modern software engineering."*
