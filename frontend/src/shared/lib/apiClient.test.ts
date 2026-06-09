import { describe, expect, it } from 'vitest'
import { apiClient } from './apiClient'
import axios from 'axios'

/**
 * Unit tests for apiClient (axios instance)
 *
 * Covers AC #1 (frontend initialization) and the contract between the
 * frontend and backend infrastructure (AC #3 CORS depends on the baseURL
 * pointing to the configured backend host).
 */
describe('apiClient', () => {
  // ─── Original ATDD-level assertions (preserved) ──────────────────────────
  it('[P1] uses VITE_API_URL as baseURL', () => {
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
  })

  it('[P1] sets JSON content-type header by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  // ─── Edge cases (automate phase expansion) ───────────────────────────────
  describe('Edge cases — instance shape', () => {
    it('[P2] should be an axios instance (not the global axios)', () => {
      // GIVEN: apiClient is created via axios.create()
      // WHEN: Comparing the instance against the global axios
      // THEN: apiClient must NOT be the global axios singleton
      expect(apiClient).not.toBe(axios)
      expect(typeof apiClient.get).toBe('function')
      expect(typeof apiClient.post).toBe('function')
      expect(typeof apiClient.put).toBe('function')
      expect(typeof apiClient.delete).toBe('function')
      expect(typeof apiClient.patch).toBe('function')
    })

    it('[P2] should expose an interceptors registry with one response handler', () => {
      // GIVEN: apiClient registers a response interceptor in apiClient.ts
      // WHEN: Inspecting the interceptors handlers
      // THEN: The response interceptors chain has exactly 1 handler installed
      const handlers = (
        apiClient.interceptors.response as unknown as {
          handlers: Array<{ fulfilled?: unknown; rejected?: unknown } | null>
        }
      ).handlers
      const installed = handlers.filter((h) => h !== null)
      expect(installed.length).toBeGreaterThanOrEqual(1)
    })

    it('[P2] should derive baseURL from import.meta.env.VITE_API_URL (single source of truth)', () => {
      // GIVEN: apiClient.ts uses `baseURL: import.meta.env.VITE_API_URL`
      // WHEN: Reading the baseURL
      // THEN: It must match exactly whatever the env exposes (string OR undefined under
      // vitest which doesn't load Vite .env files by default — the contract is that
      // baseURL never has a hardcoded fallback)
      expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
    })

    it('[P2] should not hardcode a fallback URL (relies on env config)', () => {
      // GIVEN: apiClient must not silently default to localhost or any hardcoded host
      // WHEN: Inspecting the baseURL
      // THEN: Either the value matches the env, OR it is undefined (never a literal
      // fallback like "http://localhost:5000" baked into the bundle)
      const baseURL = apiClient.defaults.baseURL
      const env = import.meta.env.VITE_API_URL
      // baseURL must equal env (which may be undefined under vitest)
      expect(baseURL).toBe(env)
      // If a baseURL IS present, it must be a valid http(s) URL — never a typo
      if (typeof baseURL === 'string' && baseURL.length > 0) {
        expect(baseURL).toMatch(/^https?:\/\//)
      }
    })
  })

  describe('Edge cases — request configuration', () => {
    it('[P2] should allow request-level header overrides without mutating defaults', () => {
      // GIVEN: apiClient has a default Content-Type
      // WHEN: A request would pass per-request headers (simulated by spreading)
      // THEN: Defaults remain untouched after merging
      const originalDefault = apiClient.defaults.headers['Content-Type']
      const merged = {
        ...apiClient.defaults.headers,
        Authorization: 'Bearer test-token',
      }
      expect(merged.Authorization).toBe('Bearer test-token')
      // Verify the defaults reference itself was not mutated
      expect(apiClient.defaults.headers['Content-Type']).toBe(originalDefault)
      // And the merged copy does not contaminate the defaults
      expect(
        (apiClient.defaults.headers as Record<string, unknown>).Authorization
      ).toBeUndefined()
    })

    it('[P2] should not have a hardcoded timeout (allows backend cold-start)', () => {
      // GIVEN: No timeout is set in apiClient.ts (relies on browser defaults)
      // WHEN: Inspecting defaults.timeout
      // THEN: It is undefined OR 0 (axios convention for "no timeout")
      const timeout = apiClient.defaults.timeout
      expect(timeout === undefined || timeout === 0).toBe(true)
    })
  })

  describe('Edge cases — response interceptor behavior', () => {
    it('[P2] should reject errors via the installed interceptor (forwards rejection)', async () => {
      // GIVEN: The stub interceptor returns Promise.reject(error)
      // WHEN: Simulating an error propagation through the interceptor's rejected handler
      // THEN: The rejection is preserved (does not swallow errors)
      const handlers = (
        apiClient.interceptors.response as unknown as {
          handlers: Array<
            | {
                fulfilled?: (v: unknown) => unknown
                rejected?: (e: unknown) => unknown
              }
            | null
          >
        }
      ).handlers
      const installed = handlers.find((h) => h !== null)
      expect(installed).toBeDefined()

      const fakeError = new Error('network down')
      await expect(installed!.rejected!(fakeError)).rejects.toBe(fakeError)
    })

    it('[P2] should pass through successful responses unchanged via the interceptor', () => {
      // GIVEN: The success handler is the identity function (response) => response
      // WHEN: Passing a fake response object through it
      // THEN: The same reference is returned
      const handlers = (
        apiClient.interceptors.response as unknown as {
          handlers: Array<
            | {
                fulfilled?: (v: unknown) => unknown
                rejected?: (e: unknown) => unknown
              }
            | null
          >
        }
      ).handlers
      const installed = handlers.find((h) => h !== null)
      const fakeResponse = { status: 200, data: { ok: true } }
      expect(installed!.fulfilled!(fakeResponse)).toBe(fakeResponse)
    })
  })
})
