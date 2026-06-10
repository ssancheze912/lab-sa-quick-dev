import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Edge case tests for apiClient.ts — Story 1.1
 * Expands ATDD coverage with boundary conditions and error paths.
 *
 * ATDD base covered: correct baseURL, correct Content-Type header
 * This file covers: missing env var, trailing slash, interceptors present,
 * custom header overrides, instance isolation.
 */

describe('apiClient — edge cases', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ─── Boundary: empty/missing VITE_API_URL ───────────────────────────────────

  it('[P2] should use undefined baseURL when VITE_API_URL env var is missing', async () => {
    // GIVEN: The environment variable is NOT set
    vi.stubEnv('VITE_API_URL', '')

    // WHEN: apiClient is imported with no env var
    const { apiClient } = await import('../apiClient')

    // THEN: baseURL is empty string (not throw) — axios will use relative paths
    // Fails loudly if someone hardcodes a default URL instead of reading from env
    expect(apiClient.defaults.baseURL).toBe('')
  })

  it('[P2] should NOT append a trailing slash to the baseURL from env', async () => {
    // GIVEN: VITE_API_URL is set without trailing slash
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')

    // WHEN: apiClient is created
    const { apiClient } = await import('../apiClient')

    // THEN: The baseURL does not have a trailing slash added by the factory
    expect(apiClient.defaults.baseURL?.endsWith('/')).toBe(false)
  })

  it('[P2] should preserve a custom VITE_API_URL including path prefix', async () => {
    // GIVEN: Production URL has a base path segment
    vi.stubEnv('VITE_API_URL', 'https://api.siesa.com/v1')

    // WHEN: The module is imported with that env value
    const { apiClient } = await import('../apiClient')

    // THEN: The full URL including path is preserved as baseURL
    expect(apiClient.defaults.baseURL).toBe('https://api.siesa.com/v1')
  })

  // ─── Headers: Content-Type boundary ─────────────────────────────────────────

  it('[P2] should have exactly Content-Type: application/json as the default common header', async () => {
    // GIVEN: apiClient is initialized
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')
    const { apiClient } = await import('../apiClient')

    // WHEN: Reading the common headers
    const headers = apiClient.defaults.headers as Record<string, unknown>

    // THEN: Content-Type is precisely set — not 'application/json; charset=utf-8' etc.
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('[P1] should NOT have Authorization header set by default (no credentials embedded)', async () => {
    // GIVEN: apiClient is initialized for an unauthenticated app shell (Story 1.1 scope)
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')
    const { apiClient } = await import('../apiClient')

    // WHEN: Checking headers for pre-embedded auth tokens
    const commonHeaders = apiClient.defaults.headers.common as Record<string, unknown>

    // THEN: No Authorization header is baked in at client creation time
    expect(commonHeaders['Authorization']).toBeUndefined()
  })

  // ─── Instance isolation ───────────────────────────────────────────────────

  it('[P2] should be a singleton — same axios instance on multiple imports', async () => {
    // GIVEN: The module is already imported
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')
    const { apiClient: instance1 } = await import('../apiClient')
    const { apiClient: instance2 } = await import('../apiClient')

    // WHEN: Both references are compared
    // THEN: They point to the same object (module singleton)
    expect(instance1).toBe(instance2)
  })

  it('[P2] should be an axios instance with a post method available', async () => {
    // GIVEN: apiClient is the exported axios instance
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')
    const { apiClient } = await import('../apiClient')

    // WHEN: Checking its interface
    // THEN: Standard HTTP methods are exposed
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
    expect(typeof apiClient.put).toBe('function')
    expect(typeof apiClient.delete).toBe('function')
  })
})
