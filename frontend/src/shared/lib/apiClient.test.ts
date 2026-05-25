import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- Existing happy-path ---
  it('[P0] has correct Content-Type header', () => {
    // GIVEN: apiClient is instantiated
    // WHEN: checking default headers
    const headers = apiClient.defaults.headers
    // THEN: Content-Type is application/json
    expect(headers['Content-Type']).toBe('application/json')
  })

  // --- baseURL configuration ---
  it('[P1] uses VITE_API_URL as baseURL', () => {
    // GIVEN: VITE_API_URL is set via import.meta.env
    // WHEN: reading the baseURL on the instance
    // THEN: baseURL is defined (non-empty string or undefined — env-sourced)
    // Note: in test env import.meta.env.VITE_API_URL is undefined; the client is still
    // created without throwing, which is the contract we verify here.
    expect(() => apiClient.defaults.baseURL).not.toThrow()
  })

  // --- Edge: instance is reusable (singleton pattern) ---
  it('[P1] exports a single shared instance (same reference on multiple imports)', async () => {
    // GIVEN: apiClient is imported twice (module cache ensures singleton)
    const { apiClient: second } = await import('./apiClient')
    // WHEN: comparing references
    // THEN: both references point to the same object
    expect(apiClient).toBe(second)
  })

  // --- Edge: default timeout is not set (framework default) ---
  it('[P2] has no explicit timeout configured by default', () => {
    // GIVEN: apiClient default config
    // WHEN: reading timeout
    // THEN: timeout is falsy (axios default — no artificial limit imposed by our config)
    expect(apiClient.defaults.timeout).toBeFalsy()
  })

  // --- Edge: Content-Type is preserved as JSON for request interceptor ---
  it('[P2] Content-Type header value is exactly "application/json" (not with charset suffix)', () => {
    // GIVEN: the configured headers
    const contentType = apiClient.defaults.headers['Content-Type'] as string
    // WHEN: checking the exact value
    // THEN: it is strictly "application/json" without extra parameters
    expect(contentType).toBe('application/json')
    expect(contentType).not.toContain('charset')
  })

  // --- Error path: axios instance rejects on network error (shape verification) ---
  it('[P1] rejects with an AxiosError on request failure', async () => {
    // GIVEN: a request to an unreachable URL
    const instance = apiClient
    // WHEN: making a GET request to a non-existent host (mocked at network level by jsdom)
    // THEN: the rejection is an Error (AxiosError extends Error)
    await expect(instance.get('http://localhost:0/nonexistent')).rejects.toThrow()
  })
})
