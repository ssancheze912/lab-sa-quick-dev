/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// TODO: Uncomment after running: pnpm add -D @tanstack/router-plugin @tailwindcss/vite tailwindcss
// import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
// import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    // TanStackRouterVite(), // Required for file-based routing auto-generation
    react(),
    // tailwindcss(),        // Required for TailwindCSS v4 processing
  ],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    env: {
      VITE_API_URL: 'http://localhost:5000',
    },
  },
})
