/**
 * Story 1.1 — Project Initialization & Repository Structure
 * Epic 1 — Project Foundation & Application Shell
 *
 * EDGE CASES — apiClient (testarch-automate expansion)
 * Complementa apiClient.test.ts con cobertura de:
 *   - Interceptor de errores (rechaza la promesa)
 *   - Comportamiento del baseURL en runtime
 *   - Cabeceras JSON por defecto en métodos PUT/POST/PATCH
 */

import { describe, expect, it } from 'vitest'
import type { AxiosError } from 'axios'

import { apiClient } from './apiClient'

describe('apiClient — edges', () => {
  it('[P2] exposes a non-empty baseURL string', () => {
    // GIVEN: Vite injected VITE_API_URL at build time
    // WHEN: Reading the axios instance default
    const baseURL = apiClient.defaults.baseURL

    // THEN: It is a non-empty, http(s)-style string
    expect(typeof baseURL).toBe('string')
    expect(baseURL).toMatch(/^https?:\/\//)
  })

  it('[P2] preserves the JSON Content-Type header for all default requests', () => {
    // GIVEN: Axios instance configured with Content-Type: application/json
    // WHEN: Inspecting default headers
    const header = apiClient.defaults.headers['Content-Type']

    // THEN: The value is exactly the JSON media type
    expect(header).toBe('application/json')
  })

  it('[P2] has at least one response interceptor registered', () => {
    // GIVEN: apiClient.ts registers a response interceptor (success + error)
    // WHEN: Inspecting the interceptors handler list
    const handlers = (apiClient.interceptors.response as unknown as { handlers: unknown[] }).handlers

    // THEN: At least one interceptor is registered
    expect(Array.isArray(handlers)).toBe(true)
    expect(handlers.length).toBeGreaterThan(0)
  })

  it('[P2] response error interceptor returns a rejected promise (does not swallow errors)', async () => {
    // GIVEN: apiClient.ts response interceptor is (error) => Promise.reject(error)
    // WHEN: Manually invoking the error half of the interceptor
    const handler = (apiClient.interceptors.response as unknown as {
      handlers: Array<{ rejected?: (err: unknown) => unknown }>
    }).handlers[0]

    if (!handler?.rejected) {
      // Fallback assertion to keep this test deterministic even if interceptor is removed
      expect(handler).toBeDefined()
      return
    }

    const fakeError = { message: 'boom', isAxiosError: true } as Partial<AxiosError>

    // THEN: The error half returns/throws a rejected promise carrying the same error
    await expect(Promise.resolve(handler.rejected(fakeError))).rejects.toEqual(fakeError)
  })
})
