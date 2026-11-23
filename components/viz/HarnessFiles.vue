<script setup lang="ts">
/**
 * HarnessFiles — Concept 4, second slide. What a harness actually is, as the
 * files on disk. Three columns match the three ring segments on the previous
 * slide: Context (what the model is told), Permissions (what it may run) and
 * Sandbox (what it may touch). Each step reveals one column; the last step
 * draws the line that matters: some of these the model reads and may follow,
 * the rest are enforced by the harness and the model cannot change them.
 *
 * Formats and field names follow the public docs as of November 2026:
 *   - AGENTS.md and .cursor/rules/*.mdc: cursor.com/docs/rules
 *   - SKILL.md: agentskills.io/specification (name, description; loaded on demand)
 *   - permissions.deny/ask/allow, evaluated deny → ask → allow:
 *     code.claude.com/docs/en/permissions
 *   - sandbox.json networkPolicy: cursor.com/docs/reference/sandbox
 *   - hooks.json beforeShellExecution: cursor.com/docs/hooks
 */
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

const { at } = useVizSteps(4)

interface File {
  name: string
  kind: 'guidance' | 'enforced'
  tip: string
  body: string
}

const columns: { id: string; title: string; question: string; files: File[] }[] = [
  {
    id: 'context',
    title: 'Context',
    question: 'What is the model told?',
    files: [
      {
        name: 'AGENTS.md',
        kind: 'guidance',
        tip: 'Plain Markdown at the project root (nested copies apply to their folder). Read at the start of every session.',
        body: `# C$50 Finance
Flask + SQLite. Run with \`flask run\`.
Queries go through \`db.execute\` with \`?\`
placeholders. Never f-strings.
Money is NUMERIC; format with \`usd\`.
Test plan: see the spec's "Testing".`,
      },
      {
        name: 'skills/review-finance/SKILL.md',
        kind: 'guidance',
        tip: 'A skill: instructions the agent loads only when the task matches the description. Libraries of these exist (pstack, Compound Engineering\u2019s ce-* skills).',
        body: `---
name: review-finance
description: Review a Finance route
  against the pset spec. Use when
  editing app.py.
---
1. Read the route's spec section.
2. Check each "render an apology" rule.
3. Run the "unexpected usage" inputs.`,
      },
    ],
  },
  {
    id: 'permissions',
    title: 'Permissions',
    question: 'What may it run without asking?',
    files: [
      {
        name: '.claude/settings.json',
        kind: 'enforced',
        tip: 'Checked by the harness before every tool call: deny first, then ask, then allow. "Enforced by Claude Code, not by the model." (docs)',
        body: `{ "permissions": {
    "allow": ["Bash(flask run *)",
              "Bash(sqlite3 * .schema)"],
    "ask":   ["Bash(sqlite3 *)"],
    "deny":  ["Read(./.env)",
              "Bash(rm *)"]
} }`,
      },
      {
        name: '.cursor/hooks.json',
        kind: 'enforced',
        tip: 'A script that runs before a shell command and can allow, ask, or deny. The model never sees it.',
        body: `{ "version": 1, "hooks": {
    "beforeShellExecution": [{
      "command": "./hooks/no-drops.sh",
      "matcher": "sqlite3|DROP"
} ] } }`,
      },
    ],
  },
  {
    id: 'sandbox',
    title: 'Sandbox',
    question: 'What may it touch?',
    files: [
      {
        name: '.cursor/sandbox.json',
        kind: 'enforced',
        tip: 'Operating-system limits on files and network for commands the agent runs. Team policy can tighten this; a prompt cannot loosen it.',
        body: `{ "type": "workspace_readwrite",
  "additionalReadonlyPaths": [
    "~/finance-backups" ],
  "networkPolicy": {
    "default": "deny",
    "allow": ["pypi.org", "api.iex.cloud"]
} }`,
      },
    ],
  },
]
</script>

<template>
  <div class="viz files">
    <div class="cols">
      <section v-for="(col, i) in columns" :key="col.id" class="viz-card col viz-enter" :class="{ shown: at(i + 1) }">
        <div class="head">
          <span class="viz-label accent">{{ col.title }}</span>
          <span class="q">{{ col.question }}</span>
        </div>
        <div v-for="f in col.files" :key="f.name" class="file" :class="[f.kind, { tagged: at(4) }]">
          <Tip :text="f.tip" side="bottom">
            <div class="fname viz-mono">
              <span>{{ f.name }}</span>
              <span class="kind viz-enter" :class="{ shown: at(4) }">{{ f.kind === 'guidance' ? 'model reads it' : 'harness enforces it' }}</span>
            </div>
          </Tip>
          <pre class="viz-mono">{{ f.body }}</pre>
        </div>
      </section>
    </div>
    <div class="verdict viz-enter" :class="{ shown: at(4) }">
      Two kinds of file. The first kind the model <b>reads</b> and usually follows. The second kind the harness <b>enforces</b>, and no prompt can change it.
      <span class="src">"Permission rules are enforced by Claude Code, not by the model." — the docs</span>
    </div>
  </div>
</template>

<style scoped>
.files {
  grid-template-rows: 1fr auto;
  gap: 0.6rem;
}
.cols {
  display: grid;
  grid-template-columns: 1.15fr 1.2fr 1fr;
  gap: 0.6rem;
  min-height: 0;
}
.col {
  padding: 0.6rem 0.7rem;
  gap: 0.5rem;
  overflow: hidden;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.head .viz-label {
  margin: 0;
}
.q {
  font-size: 0.78rem;
  color: var(--cs50-muted);
}
.file {
  border: 1px solid var(--cs50-border);
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 300ms;
}
.file.tagged.guidance {
  border-color: #adb5bd;
}
.file.tagged.enforced {
  border-color: var(--cs50-crimson);
}
.file :deep(.tip) {
  display: block;
}
.fname {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.15rem 0.5rem;
  padding: 0.28rem 0.55rem;
  font-size: 0.66rem;
  background: #fff;
  border-bottom: 1px solid var(--cs50-border);
  color: var(--cs50-body);
}
.kind {
  font-family: 'PT Sans', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  white-space: nowrap;
}
.guidance .kind {
  color: var(--cs50-muted);
}
.enforced .kind {
  color: var(--cs50-crimson);
}
pre {
  margin: 0;
  padding: 0.4rem 0.55rem;
  font-size: 0.6rem;
  line-height: 1.4;
  background: var(--cs50-code-bg);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.verdict {
  font-size: 0.88rem;
  text-align: center;
  line-height: 1.45;
}
.verdict b {
  color: var(--cs50-crimson);
}
.src {
  display: block;
  font-size: 0.72rem;
  color: var(--cs50-muted);
  margin-top: 0.15rem;
}
</style>
