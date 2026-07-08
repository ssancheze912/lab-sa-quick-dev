/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit tests — apiClient (Axios instance wiring)
 *
 * Expands ATDD coverage (E2E/API level) with a unit-level edge case:
 * the axios instance must read its baseURL from VITE_API_URL at module
 * load time, not from a hardcoded value. This was not covered by the
 * ATDD suite (e2e/tests/foundation, e2e/tests/api), which only verifies
 * runtime CORS/network behavior, not the client configuration itself.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

describe('apiClient configuration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('[P1] should set baseURL from VITE_API_URL environment variable', async () => {
    // GIVEN: VITE_API_URL is set to a specific backend URL
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')

    // WHEN: the apiClient module is loaded
    const { apiClient } = await import('./apiClient')

    // THEN: axios baseURL matches the configured environment variable
    expect(apiClient.defaults.baseURL).toBe('http://localhost:5000')
  })

  test('[P2] should track baseURL changes when VITE_API_URL differs per environment', async () => {
    // GIVEN: a non-default backend URL (e.g. staging/CI override)
    vi.stubEnv('VITE_API_URL', 'https://api.staging.siesa-agents.example')

    // WHEN: the apiClient module is loaded
    const { apiClient } = await import('./apiClient')

    // THEN: baseURL is not hardcoded — it reflects the injected env value
    expect(apiClient.defaults.baseURL).toBe('https://api.staging.siesa-agents.example')
  })

  test('[P2] should default the Content-Type header to application/json', async () => {
    // GIVEN: the apiClient module is loaded with any VITE_API_URL
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')

    // WHEN: importing the configured axios instance
    const { apiClient } = await import('./apiClient')

    // THEN: every request defaults to JSON content type
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
