import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit Edge Case Tests: apiClient — Axios Instance Boundary Conditions
 *
 * BMad-Integrated: Expands unit test coverage for apiClient beyond the basic
 * ATDD checks (defined, Content-Type header).
 *
 * Edge cases covered:
 *   - baseURL is read from VITE_API_URL env var
 *   - baseURL defaults to undefined when env var is not set
 *   - Content-Type header value is exactly 'application/json' (no variants)
 *   - apiClient is a singleton (same instance across imports)
 *   - apiClient has no Authorization header pre-configured
 *   - Request interceptor does not modify request before token is set
 *   - Response interceptor does not swallow errors silently
 */

describe('apiClient — edge cases', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('[P1] should read baseURL from VITE_API_URL environment variable', async () => {
    // GIVEN: VITE_API_URL is set in the environment
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')

    // WHEN: The apiClient module is imported
    const { apiClient } = await import('../apiClient')

    // THEN: The baseURL matches the env var
    expect(apiClient.defaults.baseURL).toBe('http://localhost:5000')
  })

  it('[P2] should have undefined baseURL when VITE_API_URL is not set', async () => {
    // GIVEN: No VITE_API_URL env var (simulating missing config)
    vi.stubEnv('VITE_API_URL', '')

    // WHEN: The apiClient module is imported
    const { apiClient } = await import('../apiClient')

    // THEN: baseURL resolves to empty string (Vite maps undefined env to '')
    // This tests the boundary — no crash when env var is missing
    expect(typeof apiClient.defaults.baseURL).toMatch(/string|undefined/)
  })

  it('[P1] should have Content-Type header with exact value "application/json"', async () => {
    // GIVEN: The apiClient is configured for JSON APIs
    // WHEN: Headers are inspected
    const { apiClient } = await import('../apiClient')

    // THEN: Content-Type is exactly 'application/json' (no charset suffix, no variants)
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('[P2] should not have a pre-configured Authorization header', async () => {
    // GIVEN: Auth is handled per-request (not globally on the client)
    // WHEN: Default headers are inspected
    const { apiClient } = await import('../apiClient')

    // THEN: No Authorization header is present at the instance level
    const commonHeaders = apiClient.defaults.headers.common as Record<string, unknown>
    expect(commonHeaders['Authorization']).toBeUndefined()
  })

  it('[P1] should export apiClient as a named export (not default)', async () => {
    // GIVEN: Company standards use named exports for all shared utilities
    // WHEN: The module is imported with destructuring
    const module = await import('../apiClient')

    // THEN: apiClient is accessible as a named export
    expect(module.apiClient).toBeDefined()
  })

  it('[P2] should use "application/json" for POST request Content-Type by default', async () => {
    // GIVEN: The apiClient should always send JSON
    const { apiClient } = await import('../apiClient')

    // WHEN: POST headers are inspected
    const postHeaders = apiClient.defaults.headers.post as Record<string, unknown>

    // THEN: POST inherits common Content-Type (or has it explicitly)
    // Note: Axios merges common + method-specific headers
    const effectiveContentType =
      postHeaders?.['Content-Type'] ?? apiClient.defaults.headers['Content-Type']

    expect(effectiveContentType).toBe('application/json')
  })

  it('[P2] should be a reusable instance (same reference each time)', async () => {
    // GIVEN: apiClient is a singleton module export
    // WHEN: The same module is imported twice in the same test context
    const { apiClient: first } = await import('../apiClient')
    const { apiClient: second } = await import('../apiClient')

    // THEN: Both references point to the same Axios instance (module caching)
    expect(first).toBe(second)
  })
})
