/**
 * Vitest configuration for frontend unit tests.
 * Separate from vite.config.ts to avoid running Playwright-specific or
 * TanStack Router plugin during unit test runs.
 *
 * Test files:
 *   - src/**\/__tests__\/*.unit.test.ts
 *   - src/**\/*.test.ts (future)
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'frontend-unit',
    environment: 'node',
    environmentMatchGlobs: [
      ['src/routes/__tests__/**', 'jsdom'],
    ],
    globals: false,
    include: [
      'src/**/__tests__/**/*.unit.test.ts',
      'src/**/*.unit.test.ts',
      // E2E helper unit tests (data factories, helpers)
      '../e2e/helpers/__tests__/**/*.unit.test.ts',
    ],
    exclude: ['node_modules/**', 'dist/**'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/shared/**', 'src/app/**'],
      exclude: ['src/**/__tests__/**', 'node_modules/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Replicate import.meta.env for unit tests
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5000'),
    'import.meta.env.MODE': JSON.stringify('test'),
    'import.meta.env.DEV': JSON.stringify(true),
    'import.meta.env.PROD': JSON.stringify(false),
  },
});
