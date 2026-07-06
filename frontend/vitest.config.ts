import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * Dedicated Vitest configuration (Story 1.2, Task 4).
 * Kept separate from vite.config.ts to avoid running the TanStack Router
 * file-based route generation plugin during unit/component test runs.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
