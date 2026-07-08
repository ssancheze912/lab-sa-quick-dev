/**
 * Story 1.1 — Expanded coverage for apiClient (edge cases).
 *
 * The ATDD baseline (apiClient.test.ts) only verifies default headers and
 * baseURL. These tests exercise the response interceptor error path,
 * additional Axios defaults, and the fact that the singleton is reused.
 */
import { describe, expect, it } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient — edge cases and boundary behaviour', () => {
  it('[P2] should reject in the response interceptor with the original error preserved', async () => {
    // GIVEN: The apiClient has a response interceptor that maps errors to Promise.reject
    // WHEN: The interceptor's rejection handler is invoked directly with an Error
    const interceptor = apiClient.interceptors.response
    // Axios exposes handlers on the interceptor manager at runtime.
    const handlers = (interceptor as unknown as {
      handlers: Array<{ rejected?: (error: unknown) => unknown }>
    }).handlers

    const errorHandler = handlers.find((h) => typeof h.rejected === 'function')?.rejected
    expect(typeof errorHandler).toBe('function')

    const injected = new Error('network failure')
    // THEN: The handler propagates the error via Promise.reject
    await expect(errorHandler!(injected)).rejects.toBe(injected)
  })

  it('[P2] should pass through successful responses unchanged in the interceptor', () => {
    // GIVEN: A successful response object shaped like AxiosResponse
    const interceptor = apiClient.interceptors.response
    // Axios exposes handlers on the interceptor manager at runtime.
    const handlers = (interceptor as unknown as {
      handlers: Array<{ fulfilled?: (value: unknown) => unknown }>
    }).handlers

    const successHandler = handlers.find((h) => typeof h.fulfilled === 'function')?.fulfilled
    expect(typeof successHandler).toBe('function')

    const fakeResponse = { status: 200, data: { ok: true } }
    // WHEN/THEN: The handler returns the same object
    expect(successHandler!(fakeResponse)).toBe(fakeResponse)
  })

  it('[P2] should be a singleton instance reused across imports', async () => {
    // GIVEN: apiClient.ts exports a single AxiosInstance
    // WHEN: The module is re-imported
    const again = await import('./apiClient')

    // THEN: The exported instance is referentially equal
    expect(again.apiClient).toBe(apiClient)
  })

  it('[P1] should not silently swallow a non-string baseURL configuration', () => {
    // GIVEN: The AxiosInstance was created with baseURL from import.meta.env.VITE_API_URL
    // WHEN: baseURL is read back
    const value = apiClient.defaults.baseURL

    // THEN: It is a non-empty string (guards against accidental undefined build config)
    expect(typeof value).toBe('string')
    expect((value ?? '').length).toBeGreaterThan(0)
  })
})
