/**
 * useLive — is this component on a slide that is actually being presented?
 *
 * True in the main slide view and the presenter view, false in the overview
 * grid, the "next slide" preview, and the print/export render (which uses the
 * slide context but should never open a socket or wait for a vote).
 * Components that talk to the audience hub gate on this.
 *
 * Print mode is read from the app-wide nav, not the slide's `$nav`: the print
 * page hands each slide a fixed nav whose isPrintMode is always false.
 */
import { useNav, useSlideContext } from '@slidev/client'

export function useLive(): boolean {
  const { $renderContext } = useSlideContext()
  const { isPrintMode } = useNav()
  return ['slide', 'presenter'].includes($renderContext.value) && !isPrintMode.value
}
