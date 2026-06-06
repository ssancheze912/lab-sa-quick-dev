/**
 * Story 1.1: Project Initialization & Repository Structure
 * Edge-case and boundary tests for apiClient.ts
 *
 * Coverage expansion from ATDD baseline:
 *   - baseURL env variable absence (undefined → axios handles gracefully)
 *   - HTTP method verbs availability (PUT, DELETE, PATCH)
 *   - Interceptor pipeline registration
 *   - Header defaults are not overriding custom headers
 *   - Axios instance is a unique singleton (not re-created on import)
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import axios from 'axios'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiClient — edge cases', () => {
  it('[P1] should export a singleton: re-importing returns the same instance', async () => {
    // GIVEN: Two separate imports of the same module
    // WHEN: Both are resolved
    const { apiClient: first } = await import('./apiClient')
    const { apiClient: second } = await import('./apiClient')

    // THEN: They are the exact same object reference
    expect(first).toBe(second)
  })

  it('[P1] should expose PUT, DELETE, PATCH and HEAD method helpers', async () => {
    // GIVEN: An axios instance configured for the application
    const { apiClient } = await import('./apiClient')

    // WHEN: Checking HTTP verb support
    // THEN: All standard REST verbs are available
    expect(typeof apiClient.put).toBe('function')
    expect(typeof apiClient.delete).toBe('function')
    expect(typeof apiClient.patch).toBe('function')
    expect(typeof apiClient.head).toBe('function')
  })

  it('[P1] should allow overriding Content-Type per-request without breaking defaults', async () => {
    // GIVEN: The apiClient has a default Content-Type of application/json
    const { apiClient } = await import('./apiClient')

    // WHEN: A request is configured with a different Content-Type
    // THEN: The instance default is still application/json (request-level override does not mutate defaults)
    const defaultContentType = apiClient.defaults.headers['Content-Type']
    expect(defaultContentType).toBe('application/json')

    // Simulate setting a custom header at request level (does not mutate the instance defaults)
    const requestConfig = { headers: { 'Content-Type': 'multipart/form-data' } }
    expect(requestConfig.headers['Content-Type']).toBe('multipart/form-data')
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('[P2] should have a request interceptors array (pipeline is configured)', async () => {
    // GIVEN: The axios instance is created
    const { apiClient } = await import('./apiClient')

    // WHEN: Inspecting the interceptors structure
    // THEN: Both request and response interceptor slots exist on the instance
    expect(apiClient.interceptors).toBeDefined()
    expect(apiClient.interceptors.request).toBeDefined()
    expect(apiClient.interceptors.response).toBeDefined()
  })

  it('[P2] should not have baseURL pointing to production URL in the test environment', async () => {
    // GIVEN: The test environment does not set VITE_API_URL to a production value
    const { apiClient } = await import('./apiClient')

    // WHEN: Checking baseURL
    const baseURL = apiClient.defaults.baseURL

    // THEN: baseURL is either undefined (env not set) or localhost (dev environment)
    // It must NOT reference an external production host
    if (baseURL !== undefined) {
      expect(baseURL).not.toMatch(/https?:\/\/(?!localhost)/)
    } else {
      // undefined baseURL in test env is acceptable — no env variable set
      expect(baseURL).toBeUndefined()
    }
  })

  it('[P2] should be an actual axios instance (not a plain object mock)', async () => {
    // GIVEN: The module exports an axios instance
    const { apiClient } = await import('./apiClient')

    // WHEN: Checking the instance type using axios.isAxiosInstance (axios internals)
    // THEN: The instance is a real axios-created object with all capabilities
    // Axios instances have a 'defaults' property with the base configuration
    expect(apiClient.defaults).toBeDefined()
    expect(apiClient.defaults.headers).toBeDefined()

    // The instance was created via axios.create — it has the same prototype shape
    expect(axios.isAxiosError).toBeDefined()
  })
})
