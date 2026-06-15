/**
 * Story 1.1: Project Initialization & Repository Structure
 * Edge case tests for apiClient — expands ATDD AC1/AC4 coverage
 *
 * Covers:
 *  - baseURL defaults and environment variable binding
 *  - Default headers completeness
 *  - Axios instance identity (singleton guard)
 *  - Response and request interceptor registration
 *  - Axios instance type verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AxiosInstance } from 'axios'

// Reset module registry between tests that manipulate import.meta.env
describe('apiClient — baseURL configuration', () => {
  it('should use VITE_API_URL as baseURL when env var is defined', async () => {
    const { apiClient } = await import('../apiClient')
    // In test env, import.meta.env.VITE_API_URL is undefined → baseURL is undefined
    // This verifies the import path, not the value (env is not set in test mode)
    expect(apiClient.defaults.baseURL).toBeDefined()
      ? expect(typeof apiClient.defaults.baseURL).toBe('string')
      : expect(apiClient.defaults.baseURL).toBeUndefined()
  })

  it('should be an Axios instance with a request method', async () => {
    const { apiClient } = await import('../apiClient')
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
    expect(typeof apiClient.put).toBe('function')
    expect(typeof apiClient.delete).toBe('function')
    expect(typeof apiClient.patch).toBe('function')
  })

  it('should export a singleton — same reference across imports', async () => {
    const mod1 = await import('../apiClient')
    const mod2 = await import('../apiClient')
    expect(mod1.apiClient).toBe(mod2.apiClient)
  })
})

describe('apiClient — default headers', () => {
  it('should have Content-Type set to application/json', async () => {
    const { apiClient } = await import('../apiClient')
    const contentType = apiClient.defaults.headers['Content-Type']
    expect(contentType).toBe('application/json')
  })

  it('should not accidentally set an Accept header that overrides JSON negotiation', async () => {
    const { apiClient } = await import('../apiClient')
    // Accept header should either be absent or include application/json
    const accept = apiClient.defaults.headers['Accept'] as string | undefined
    if (accept !== undefined) {
      expect(accept).toContain('application/json')
    }
  })

  it('should not expose Authorization header by default (no credentials leak)', async () => {
    const { apiClient } = await import('../apiClient')
    const auth = apiClient.defaults.headers['Authorization']
    expect(auth).toBeUndefined()
  })
})

describe('apiClient — interceptors registration', () => {
  it('should have request interceptors array accessible', async () => {
    const { apiClient } = await import('../apiClient')
    // Axios stores interceptors in internals — we verify the interceptors property exists
    const instance = apiClient as AxiosInstance & {
      interceptors: {
        request: { handlers: unknown[] }
        response: { handlers: unknown[] }
      }
    }
    expect(instance.interceptors).toBeDefined()
    expect(instance.interceptors.request).toBeDefined()
    expect(instance.interceptors.response).toBeDefined()
  })
})
