import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Vitest configuration for unit tests (Node environment — no DOM required
 * for the shared/lib modules covered so far). Component-level tests that
 * need a DOM should add `environment: 'jsdom'` via a test-level override
 * once jsdom is added as a dependency.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    css: false,
  },
})
