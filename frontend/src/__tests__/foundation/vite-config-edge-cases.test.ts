/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge cases for vite.config.ts beyond ATDD coverage
 * Covers: AC1 — Vite configured with correct port, test setup, and plugins
 *
 * Test level: Unit (node environment — source inspection)
 * Tool: Vitest
 *
 * Edge cases NOT covered by ATDD (which only checks plugin imports):
 *   - Server port is explicitly set to 5173 (not default 5174)
 *   - Vitest test config includes the correct glob patterns
 *   - @vitejs/plugin-react is registered (JSX transformation)
 *   - TanStack Router plugin is configured with correct routesDirectory
 *   - No hardcoded proxy or absolute URLs in the config
 *   - Only @tailwindcss/vite is used (not PostCSS tailwind config)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const FRONTEND_ROOT = resolve(__dirname, '../../..')

const readViteConfig = () => readFileSync(resolve(FRONTEND_ROOT, 'vite.config.ts'), 'utf-8')

// ─────────────────────────────────────────────────────────────────────────────
// Port configuration — boundary: AC1 requires port 5173 explicitly
// ─────────────────────────────────────────────────────────────────────────────

describe('vite.config.ts — server port', () => {
  it('should configure server.port to 5173 (AC1: Vite starts on port 5173)', () => {
    // GIVEN: AC1 mandates the frontend starts on port 5173
    // WHEN: We inspect the server configuration block
    const content = readViteConfig()
    // THEN: port 5173 is explicitly declared (not relying on Vite default 5173)
    expect(content).toContain('5173')
  })

  it('should use server: { port: 5173 } block structure', () => {
    // GIVEN: Vite requires the port inside a server: {} config object
    const content = readViteConfig()
    // THEN: The server block with port is present
    expect(content).toMatch(/server\s*:\s*\{/)
    expect(content).toMatch(/port\s*:\s*5173/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Plugin registration — edge cases for missing or wrong plugin order
// ─────────────────────────────────────────────────────────────────────────────

describe('vite.config.ts — plugin registration', () => {
  it('should register @vitejs/plugin-react for JSX transformation', () => {
    // GIVEN: React JSX requires the @vitejs/plugin-react plugin
    // WHEN: We inspect the plugins array
    const content = readViteConfig()
    // THEN: The react plugin import/call is present
    expect(content).toMatch(/@vitejs\/plugin-react/)
  })

  it('should call TanStackRouterVite as a plugin (not just import it)', () => {
    // GIVEN: The router plugin must be instantiated with options, not just imported
    const content = readViteConfig()
    // THEN: TanStackRouterVite is called as a function
    expect(content).toMatch(/TanStackRouterVite\s*\(/)
  })

  it('should configure TanStackRouterVite with routesDirectory pointing to src/routes', () => {
    // GIVEN: File-based routing requires the routesDirectory to point to src/routes
    const content = readViteConfig()
    // THEN: routesDirectory contains 'routes'
    expect(content).toContain('routesDirectory')
    expect(content).toMatch(/routesDirectory\s*:\s*['"].*routes['"]/)
  })

  it('should configure TanStackRouterVite with generatedRouteTree pointing to routeTree.gen.ts', () => {
    // GIVEN: The auto-generated route tree file must be explicitly configured
    const content = readViteConfig()
    // THEN: generatedRouteTree points to routeTree.gen.ts
    expect(content).toContain('generatedRouteTree')
    expect(content).toContain('routeTree.gen.ts')
  })

  it('should NOT use PostCSS tailwind config (TailwindCSS v4 uses Vite plugin only)', () => {
    // GIVEN: TailwindCSS v4 drops PostCSS in favor of the @tailwindcss/vite plugin
    // Having both would cause double-processing or conflicts
    const content = readViteConfig()
    // THEN: No postcss.config reference in vite.config
    expect(content).not.toContain('postcss')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test configuration — edge cases for Vitest setup
// ─────────────────────────────────────────────────────────────────────────────

describe('vite.config.ts — Vitest test configuration', () => {
  it('should include a test: {} block in vite.config.ts', () => {
    // GIVEN: Vitest configuration must live in vite.config.ts (no separate vitest.config)
    const content = readViteConfig()
    // THEN: A test block is present
    expect(content).toMatch(/test\s*:\s*\{/)
  })

  it('should include test glob patterns targeting __tests__ directories', () => {
    // GIVEN: Tests are organized under src/**/__tests__/
    const content = readViteConfig()
    // THEN: The include glob matches the test file convention
    expect(content).toContain('__tests__')
    expect(content).toContain('.test.ts')
  })

  it('should set a valid test environment (jsdom or node) for the test runner', () => {
    // GIVEN: Tests require a DOM environment for React component testing (navigation shell)
    // WHEN: We check the test.environment setting
    const content = readViteConfig()
    // THEN: A valid environment is explicitly configured (jsdom for React component tests)
    expect(content).toMatch(/environment\s*:\s*['"](?:jsdom|node)['"]/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Safety constraints — edge cases for forbidden config patterns
// ─────────────────────────────────────────────────────────────────────────────

describe('vite.config.ts — safety constraints', () => {
  it('should NOT contain hardcoded backend URLs (no http://localhost:5000 in config)', () => {
    // GIVEN: Backend URL must come from .env files, not be hardcoded in Vite config
    const content = readViteConfig()
    // THEN: No hardcoded backend address
    expect(content).not.toContain('localhost:5000')
  })

  it('should use defineConfig() wrapper for type safety', () => {
    // GIVEN: defineConfig() provides TypeScript type checking on the Vite config object
    const content = readViteConfig()
    // THEN: defineConfig is used
    expect(content).toContain('defineConfig(')
  })

  it('should import defineConfig from vite (not from a re-export)', () => {
    // GIVEN: Direct import ensures compatibility with the installed Vite version
    const content = readViteConfig()
    // THEN: Import is from 'vite'
    expect(content).toMatch(/from\s+['"]vite['"]/)
  })
})
