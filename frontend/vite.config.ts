import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @tanstack/router-plugin — file-based route auto-generation for TanStack Router
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    TanStackRouterVite(),
  ],
})
