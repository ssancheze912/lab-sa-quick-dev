import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    env: {
      // Deterministic API base for all tests. MSW intercepts `*/api/v1/*`
      // regardless, but modules that read `import.meta.env.VITE_API_URL` at
      // import time (e.g. `shared/lib/apiClient.ts`) still need a value.
      VITE_API_URL: 'http://localhost:5000',
    },
  },
})
