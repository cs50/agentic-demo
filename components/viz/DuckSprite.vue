<script setup lang="ts">
/**
 * DuckSprite — the game's duck, as SVG, for slides. Same pixel map as the
 * canvas (demo/mario/duck.ts), so what students see on a slide is exactly
 * what runs in the game.
 */
import { computed } from 'vue'
import { DUCK_COLS, DUCK_ROWS_N, duckPixel } from '../../demo/mario/duck'

const props = withDefaults(defineProps<{ facing?: 1 | -1; size?: number }>(), { facing: 1, size: 56 })

const pixels = computed(() => {
  const out: { x: number; y: number; fill: string }[] = []
  for (let r = 0; r < DUCK_ROWS_N; r++) {
    for (let c = 0; c < DUCK_COLS; c++) {
      const fill = duckPixel(c, r, props.facing)
      if (fill) out.push({ x: c, y: r, fill })
    }
  }
  return out
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${DUCK_COLS} ${DUCK_ROWS_N}`"
    shape-rendering="crispEdges"
    role="img"
    aria-label="The CS50 duck"
  >
    <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
  </svg>
</template>
