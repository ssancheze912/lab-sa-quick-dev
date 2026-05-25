/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge cases for apiClient (Axios instance)
 * Expands coverage beyond ATDD: configuration details, interceptors, singleton
 *
 * Acceptance Criteria covered: AC1 (apiClient.ts file + correct config)
 * Test level: Unit
 * Tool: Vitest
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// From frontend/src/__tests__/setup/ → go up 3 levels to reach frontend/
const FRONTEND_ROOT = resolve(__dirname, '../../..')

// ─────────────────────────────────────────────────────────────────────────────
// File existence — boundary condition: the file must exist before import
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — file structure', () => {
  it('should have apiClient.ts at the expected path (src/shared/lib/apiClient.ts)', () => {
    // GIVEN: The shared library folder structure was established in Task 1
    const apiClientPath = resolve(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts')
    // THEN: The file must exist (not renamed or moved)
    expect(existsSync(apiClientPath)).toBe(true)
  })

  it('should be located inside src/shared/lib/ following feature-slice architecture', () => {
    // GIVEN: Company standard mandates src/shared/lib/ for shared infrastructure utilities
    const sharedLibDir = resolve(FRONTEND_ROOT, 'src/shared/lib')
    // THEN: The directory exists with the expected contents
    expect(existsSync(sharedLibDir)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Content inspection — exact config values (edge cases for wrong values)
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — configuration content', () => {
  it('should reference VITE_API_URL as the baseURL (not a hardcoded http://localhost:5000)', () => {
    // GIVEN: The Axios instance must read baseURL from environment at runtime
    // WHEN: We read the apiClient source
    const content = readFileSync(resolve(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts'), 'utf-8')

    // THEN: The file uses import.meta.env.VITE_API_URL — not a hardcoded URL
    // (Hardcoded URLs break staging/production environments)
    expect(content).toContain('import.meta.env.VITE_API_URL')
    expect(content).not.toMatch(/baseURL\s*:\s*['"]http:\/\/localhost/)
  })

  it('should set Content-Type: application/json as a default header', () => {
    // GIVEN: The backend expects JSON payloads on all endpoints
    // WHEN: We inspect the axios.create config
    const content = readFileSync(resolve(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts'), 'utf-8')

    // THEN: Content-Type header is declared
    expect(content).toContain('Content-Type')
    expect(content).toContain('application/json')
  })

  it('should export apiClient as a named export (not default export)', () => {
    // GIVEN: Named exports are required for tree-shaking and explicit imports
    const content = readFileSync(resolve(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts'), 'utf-8')

    // THEN: apiClient is exported as a named const
    expect(content).toMatch(/export\s+const\s+apiClient/)
  })

  it('should NOT use axios.defaults (instance-based config only, not global mutation)', () => {
    // GIVEN: Mutating axios.defaults affects all axios instances globally — a known footgun
    const content = readFileSync(resolve(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts'), 'utf-8')

    // THEN: Global defaults must not be mutated
    expect(content).not.toContain('axios.defaults')
  })

  it('should register an error interceptor that rejects with the original error (not swallowed)', () => {
    // GIVEN: Error interceptors must propagate errors to callers for proper error handling
    // WHEN: We inspect the interceptors section
    const content = readFileSync(resolve(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts'), 'utf-8')

    // THEN: An interceptors.response block must be present and call Promise.reject
    expect(content).toContain('interceptors.response')
    expect(content).toContain('Promise.reject')
  })

  it('should NOT have any "any" type annotations in apiClient.ts (strict mode requirement)', () => {
    // GIVEN: TypeScript strict mode forbids implicit any — explicit "any" is a smell too
    // WHEN: We scan the file for explicit any annotations (excluding the unknown cast pattern)
    const { readFileSync } = require('fs')
    const content = readFileSync(resolve(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts'), 'utf-8') as string

    // THEN: No ": any" type annotations are present
    // Note: ": unknown" is acceptable — ": any" is not
    const anyAnnotations = content.match(/:\s*any\b/g) ?? []
    expect(anyAnnotations).toHaveLength(0)
  })

  it('should use axios.create() to create an instance (not a direct axios import for requests)', () => {
    // GIVEN: axios.create() produces an isolated instance that does not pollute global defaults
    const { readFileSync } = require('fs')
    const content = readFileSync(resolve(FRONTEND_ROOT, 'src/shared/lib/apiClient.ts'), 'utf-8') as string

    // THEN: axios.create is called
    expect(content).toContain('axios.create(')
  })
})
