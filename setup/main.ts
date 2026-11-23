/**
 * Slidev app setup (https://sli.dev/custom/config-vue). Runs once, before the
 * app mounts, in every mode (play, presenter, overview, print, export).
 *
 * The only thing we add is the audience hub bridge, which decides for itself
 * whether this window should connect (see composables/hubSync.ts).
 *
 * Slidev's `defineAppSetup` is an identity function; it is not imported
 * because `@slidev/types` is a dependency of Slidev, not of this project, and
 * pnpm keeps it out of reach (same reason vite.config.ts imports nothing
 * from 'vite').
 */
import { installHubSync } from '../composables/hubSync'

export default function setup({ router }: { router: any }) {
  // Not awaited: the bridge waits for the router itself, and mounting should not wait for it.
  void installHubSync(router)
}
