/**
 * Shared settings for the visualizations.
 *
 * SHOW_HINTS controls every on-slide cue about what to press or hover: the
 * caption line under each visualization (layouts/concept-viz.vue) and the
 * empty-state text inside components ("Press → to ask."). The same cues live
 * in the presenter notes, so the audience doesn't need them. Set to true to
 * bring them back, e.g. when publishing the deck for students to explore.
 */
export const SHOW_HINTS = false

/** Text for an empty state when hints are off: nothing. */
export const hint = (text: string) => (SHOW_HINTS ? text : '')
