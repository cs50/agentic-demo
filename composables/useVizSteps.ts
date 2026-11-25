/**
 * useVizSteps — let a visualization component be driven by the presenter's
 * → key, exactly like `v-click`.
 *
 * Calling `useVizSteps(n)` during setup claims `n` consecutive click steps on
 * the current slide (the same mechanism Slidev's `v-click` directive uses:
 * `calculateSince` + `register` on the slide's clicks context). It returns a
 * reactive `step` from 0 (nothing yet) to `n` (complete), plus helpers.
 *
 * In contexts without clicks (overview grid, presenter "next slide" preview)
 * `step` is `n`, so the visualization shows its finished state. Print follows
 * the clicks it is given: the plain export fixes them at their maximum, so the
 * finished state again; an export with clicks renders each step in turn.
 */
import { useSlideContext } from '@slidev/client'
import { computed, onUnmounted } from 'vue'

export function useVizSteps(count: number) {
  const { $clicksContext: ctx, $clicks, $renderContext } = useSlideContext()

  // A unique key for the registration (the directive uses the element).
  const key = Symbol('viz-steps') as unknown as Element
  const info = ctx.calculateSince('+1', count)
  if (info) ctx.register(key, info)
  onUnmounted(() => ctx.unregister(key))

  const interactive = ['slide', 'presenter', 'print'].includes($renderContext.value)

  const step = computed(() => {
    if (!info || !interactive) return count
    return Math.max(0, Math.min(count, $clicks.value - info.start + 1))
  })

  /** True once step `n` (1-based) has been reached. */
  const at = (n: number) => step.value >= n
  /** True only while step `n` is the current one. */
  const is = (n: number) => step.value === n

  return { step, total: count, at, is }
}
