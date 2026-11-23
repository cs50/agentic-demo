<script setup lang="ts">
/**
 * DemoSpec — the demo's specification as acceptance criteria (Concept 5),
 * each paired with the artifact that will prove it (Concept 7). One press
 * per row. The last press names what is deliberately left out.
 */
import { useVizSteps } from '../../composables/useVizSteps'
import Tip from './Tip.vue'

interface Row {
  must: string
  detail: string
  evidence: string
}

const rows: Row[] = [
  {
    must: 'The browser sees the controller',
    detail: 'A DualShock 4 over Bluetooth, with the standard button mapping',
    evidence: 'The experiment page logs "Connected … (mapping: standard)"',
  },
  {
    must: 'Cross jumps, the left stick moves',
    detail: 'Button 0 is jump; axis 0 or the D-pad is horizontal movement',
    evidence: 'Press ✕, read "Button 0 (CROSS): DOWN"; the duck on the slide jumps',
  },
  {
    must: 'Physics is fixed, not frame-rate dependent',
    detail: '60 steps per second; gravity 0.8 px/step², jump −14 px/step',
    evidence: 'The HUD reads 60 fps (the simulation rate) on a 120 Hz display',
  },
  {
    must: 'The level is the Week 1 pyramid',
    detail: 'Eight rows, right-aligned, from a loop in level.ts',
    evidence: 'Count the rows on the canvas; read level.ts beside it',
  },
  {
    must: 'Saving level.ts rebuilds the level without a reload',
    detail: 'The duck keeps its position; a broken file keeps the old level and says why',
    evidence: 'Edit it on stage: the pyramid changes, the HUD says "level v1 live"; break it and read the strip',
  },
  {
    must: 'Losing the controller does not crash the game',
    detail: 'The game keeps running; the HUD says what input it has',
    evidence: 'Turn the controller off: the HUD switches to "press a button"; the keyboard still works',
  },
]

const { step, at } = useVizSteps(rows.length + 1)
</script>

<template>
  <div class="viz demospec">
    <table>
      <thead>
        <tr>
          <th class="n"></th>
          <th>Must hold</th>
          <th>How we will know</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="r.must" class="viz-enter" :class="{ shown: at(i + 1), latest: step === i + 1 }">
          <td class="n"><span class="num">{{ i + 1 }}</span></td>
          <td>
            <div class="must">{{ r.must }}</div>
            <div class="detail">{{ r.detail }}</div>
          </td>
          <td class="ev">
            <Tip text="A verification artifact: something you can look at, not a line of code you have to read." side="top">
              <span>{{ r.evidence }}</span>
            </Tip>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="out viz-enter" :class="{ shown: at(rows.length + 1) }">
      <span class="viz-label">Left out on purpose</span>
      <p>No score, no enemies, no sound, no second level. A specification is as much about what it does not ask for. The spec for Finance said the same thing: "You don't need to worry about race conditions."</p>
    </div>
  </div>
</template>

<style scoped>
.demospec {
  grid-template-rows: 1fr auto;
  gap: 0.5rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}
th {
  text-align: left;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cs50-muted);
  padding: 0.3rem 0.6rem;
  border-bottom: 2px solid var(--cs50-body);
}
th:nth-child(3) {
  color: var(--cs50-crimson);
}
td {
  padding: 0.32rem 0.6rem;
  border-bottom: 1px solid var(--cs50-border);
  vertical-align: top;
  line-height: 1.35;
}
tr.latest td {
  background: rgba(165, 28, 48, 0.05);
}
.n {
  width: 2rem;
}
.num {
  display: inline-grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: var(--cs50-body);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}
tr.latest .num {
  background: var(--cs50-crimson);
}
.must {
  font-weight: 700;
}
.detail {
  font-size: 0.78rem;
  color: var(--cs50-muted);
}
.ev {
  font-size: 0.82rem;
}
.out {
  padding: 0.45rem 0.9rem;
  border-left: 4px solid var(--cs50-border);
  background: var(--cs50-code-bg);
  border-radius: 6px;
}
.out .viz-label {
  margin-bottom: 0.15rem;
}
.out p {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.45;
}
</style>
