import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Load .env.development (and .env) so VITE_* vars are injected into import.meta.env
// during test runs — matches the behaviour of `vite dev`.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? 'development', process.cwd(), '')
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL ?? 'http://localhost:5000'),
    },
    test: {
      environment: 'jsdom',
      globals: true,
      css: false,
    },
  }
})
