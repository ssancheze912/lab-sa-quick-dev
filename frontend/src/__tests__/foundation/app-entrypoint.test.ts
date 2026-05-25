/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge cases for app entry point files
 * Covers: AC1, AC4 — main.tsx wiring and index.html mount point
 *
 * Test level: Unit (node environment — source inspection)
 * Tool: Vitest
 *
 * Edge cases NOT covered by ATDD:
 *   - main.tsx uses StrictMode (development quality)
 *   - main.tsx guards against missing root element (throws, not silent fail)
 *   - main.tsx wires RouterProvider + QueryProvider correctly (not reversed)
 *   - main.tsx registers the router type via declare module (TypeScript contract)
 *   - index.html has the React mount div with data-testid="app-root"
 *   - index.html loads main.tsx as type="module" (not CommonJS)
 *   - __root.tsx uses createRootRoute (not createRoute)
 *   - routeTree.gen.ts is auto-generated and exports routeTree
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const FRONTEND_ROOT = resolve(__dirname, '../../..')

const read = (path: string) => readFileSync(resolve(FRONTEND_ROOT, path), 'utf-8')

// ─────────────────────────────────────────────────────────────────────────────
// main.tsx — wiring edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('main.tsx — React app wiring', () => {
  it('should wrap the app in React.StrictMode', () => {
    // GIVEN: StrictMode catches lifecycle and ref issues during development
    const content = read('src/main.tsx')
    // THEN: StrictMode is used
    expect(content).toContain('StrictMode')
  })

  it('should use RouterProvider from @tanstack/react-router', () => {
    // GIVEN: TanStack Router requires RouterProvider as the root routing component
    const content = read('src/main.tsx')
    // THEN: RouterProvider is imported from @tanstack/react-router
    expect(content).toContain('RouterProvider')
    expect(content).toMatch(/from\s+['"]@tanstack\/react-router['"]/)
  })

  it('should wrap RouterProvider inside QueryProvider (not the reverse)', () => {
    // GIVEN: QueryProvider must be the outer wrapper so all routes have query context
    // If reversed, routes would be outside the query context and useQuery would fail
    const content = read('src/main.tsx')
    // Check JSX section: <QueryProvider> opening tag must appear before <RouterProvider
    const jsxQpIndex = content.indexOf('<QueryProvider>')
    const jsxRpIndex = content.indexOf('<RouterProvider')
    // THEN: <QueryProvider> opening tag appears before <RouterProvider (outer wraps inner)
    expect(jsxQpIndex).toBeGreaterThan(-1)
    expect(jsxRpIndex).toBeGreaterThan(-1)
    expect(jsxQpIndex).toBeLessThan(jsxRpIndex)
  })

  it('should call createRoot with the DOM root element', () => {
    // GIVEN: React 18+ uses createRoot instead of ReactDOM.render
    const content = read('src/main.tsx')
    // THEN: createRoot is used (not the legacy ReactDOM.render API)
    expect(content).toContain('createRoot(')
  })

  it('should guard against missing root element with a thrown error', () => {
    // GIVEN: Silently failing when #root is missing hides deployment errors
    const content = read('src/main.tsx')
    // THEN: An explicit throw is present when rootElement is null
    expect(content).toContain('throw new Error')
    expect(content).toContain("Root element not found")
  })

  it('should use document.getElementById("root") to find the mount point', () => {
    // GIVEN: index.html has <div id="root"> as the React mount point
    const content = read('src/main.tsx')
    // THEN: getElementById is called with 'root'
    expect(content).toMatch(/getElementById\s*\(\s*['"]root['"]\s*\)/)
  })

  it('should declare the router type via declare module (TypeScript type safety)', () => {
    // GIVEN: TanStack Router requires module augmentation for full type safety
    const content = read('src/main.tsx')
    // THEN: declare module '@tanstack/react-router' with Register interface is present
    expect(content).toContain('declare module')
    expect(content).toContain('@tanstack/react-router')
    expect(content).toContain('Register')
  })

  it('should import the routeTree from routeTree.gen.ts (auto-generated)', () => {
    // GIVEN: TanStack Router generates routeTree.gen.ts from the routes/ folder
    const content = read('src/main.tsx')
    // THEN: The import comes from the generated file
    expect(content).toMatch(/from\s+['"]\.\/routeTree\.gen['"]/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// index.html — HTML scaffold edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('index.html — HTML mount point', () => {
  it('should have a div with id="root" as the React mount point', () => {
    // GIVEN: main.tsx uses getElementById('root') to find the mount target
    const content = read('index.html')
    // THEN: A div with id="root" is in index.html
    expect(content).toMatch(/<div\s[^>]*id\s*=\s*["']root["']/)
  })

  it('should have data-testid="app-root" on the root div (Playwright E2E selector)', () => {
    // GIVEN: E2E tests verify the app loaded by checking [data-testid="app-root"]
    const content = read('index.html')
    // THEN: The test id attribute is present
    expect(content).toContain('data-testid="app-root"')
  })

  it('should load main.tsx as type="module" (not a CommonJS bundle)', () => {
    // GIVEN: ES modules are required for Vite + React + TypeScript to work correctly
    const content = read('index.html')
    // THEN: The script tag has type="module"
    expect(content).toMatch(/<script\s+type=["']module["']/)
  })

  it('should reference /src/main.tsx as the module entry point', () => {
    // GIVEN: Vite resolves /src/main.tsx as the app entry point in dev mode
    const content = read('index.html')
    // THEN: The script src points to /src/main.tsx
    expect(content).toContain('/src/main.tsx')
  })

  it('should have charset UTF-8 meta tag', () => {
    // GIVEN: UTF-8 encoding is required for international characters in agent responses
    const content = read('index.html')
    expect(content).toMatch(/<meta\s+charset\s*=\s*["']UTF-8["']/i)
  })

  it('should have a viewport meta tag for responsive layout', () => {
    // GIVEN: The app must be responsive (mobile-first company standard)
    const content = read('index.html')
    expect(content).toContain('viewport')
    expect(content).toContain('width=device-width')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// src/routes/__root.tsx — root route edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('src/routes/__root.tsx — root route definition', () => {
  it('should use createRootRoute (not createRoute) for the root', () => {
    // GIVEN: TanStack Router requires createRootRoute for the root layout
    const content = read('src/routes/__root.tsx')
    // THEN: createRootRoute is used
    expect(content).toContain('createRootRoute')
    expect(content).not.toContain('createRoute(')
  })

  it('should export Route as a named const (required by TanStack Router convention)', () => {
    // GIVEN: TanStack Router discovers routes by the export named "Route"
    const content = read('src/routes/__root.tsx')
    // THEN: export const Route is present
    expect(content).toMatch(/export\s+const\s+Route/)
  })

  it('should render an Outlet component as the root layout', () => {
    // GIVEN: The root route is a shell layout — child routes render via <Outlet />
    const content = read('src/routes/__root.tsx')
    // THEN: Outlet is used in the component
    expect(content).toContain('Outlet')
  })

  it('should import Outlet from @tanstack/react-router', () => {
    // GIVEN: Outlet is part of the TanStack Router package
    const content = read('src/routes/__root.tsx')
    // THEN: Import comes from the correct package
    expect(content).toMatch(/from\s+['"]@tanstack\/react-router['"]/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// routeTree.gen.ts — auto-generated file integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('src/routeTree.gen.ts — auto-generated route tree', () => {
  it('should export routeTree as a named export', () => {
    // GIVEN: main.tsx imports { routeTree } from routeTree.gen
    const content = read('src/routeTree.gen.ts')
    // THEN: routeTree is exported
    expect(content).toMatch(/export\s+const\s+routeTree/)
  })

  it('should contain the auto-generation header comment', () => {
    // GIVEN: The file is auto-generated and should not be manually edited
    const content = read('src/routeTree.gen.ts')
    // THEN: The standard TanStack Router auto-generated header is present
    expect(content).toContain('automatically generated')
    expect(content).toContain('TanStack Router')
  })

  it('should include the root route import', () => {
    // GIVEN: The root route __root.tsx must always be the base of the tree
    const content = read('src/routeTree.gen.ts')
    // THEN: The root route is imported
    expect(content).toContain('__root')
  })
})
