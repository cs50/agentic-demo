import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: that file is Slidev's dev-server
// config (level.ts write channel, overlay off) and has no bearing on unit tests.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
