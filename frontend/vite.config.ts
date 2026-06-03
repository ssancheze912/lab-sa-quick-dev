import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import type { Plugin } from 'vite'
import { transform } from '@babel/core'

/**
 * Pre-process .test.ts files that contain JSX.
 * Vite 8's OXC transformer rejects JSX in .ts files.
 * This plugin runs before OXC and transforms JSX in .ts test files using Babel.
 */
function babelJsxInTsPlugin(): Plugin {
  const TSX_RE = /\.(test|spec)\.ts$/
  return {
    name: 'babel-jsx-in-ts-tests',
    enforce: 'pre',
    async transform(code, id) {
      if (!TSX_RE.test(id)) return null
      if (!code.includes('<')) return null

      const result = await new Promise<ReturnType<typeof transform>>(
        (resolve, reject) => {
          transform(
            code,
            {
              filename: id,
              presets: [
                ['@babel/preset-react', { runtime: 'automatic' }],
                ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
              ],
              sourceMaps: true,
            },
            (err, res) => (err ? reject(err) : resolve(res)),
          )
        },
      )

      if (!result?.code) return null
      return { code: result.code, map: result.map ?? undefined }
    },
  }
}

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true, routeFileIgnorePattern: '\\.(test|spec)\\.(tsx|ts)$' }),
    babelJsxInTsPlugin(),
    react({ include: /\.(tsx|ts|jsx|js)$/ }),
    tailwindcss(),
  ],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
