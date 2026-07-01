import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration for Siesa Agents frontend unit tests.
 * Tests live alongside source files as *.test.ts / *.test.tsx.
 *
 * NOTE (Story 1.1): environment is set to 'node' because no React component
 * tests exist yet in Story 1.1. When Story 1.2 introduces the NavigationRail
 * and other UI components, this MUST be switched to 'jsdom' (or 'happy-dom')
 * AND the matching DOM package MUST be installed:
 *   pnpm add -D jsdom
 * Otherwise React Testing Library will fail with a "document is not defined"
 * error at runtime.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.git'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
