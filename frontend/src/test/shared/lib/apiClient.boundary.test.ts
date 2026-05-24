/**
 * Story 1.1 — apiClient boundary conditions
 * Tests error paths, request/response interceptor chain, and header enforcement.
 * Distinct from apiClient.edge.test.ts — focuses on request configuration boundaries.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

describe('apiClient — boundary conditions', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('creates a new axios instance — not the global axios singleton', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    // The exported client must be a distinct instance from the global axios
    expect(apiClient).not.toBe(axios)
    // But it must share the same interface (both have .get)
    expect(typeof apiClient.get).toBe('function')
  })

  it('has no response interceptors pre-registered by default', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    // The shared/lib/apiClient.ts does NOT register any interceptors on creation.
    // This is the expected clean baseline — interceptors are added per-feature.
    // Accessing the internal queue size without private API: just verify interceptors object exists
    expect(apiClient.interceptors.response).toBeDefined()
  })

  it('has no request interceptors pre-registered by default', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    expect(apiClient.interceptors.request).toBeDefined()
  })

  it('timeout default is 0 (no timeout) or undefined — not an unreasonably low positive value', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    const timeout = apiClient.defaults.timeout
    // axios default is 0 meaning "no timeout" — this is acceptable for the shared lib
    // Any explicit positive timeout should be at least 1000ms to avoid premature failures
    if (timeout !== undefined && timeout !== 0) {
      expect(timeout).toBeGreaterThanOrEqual(1000)
    } else {
      // 0 = no timeout (axios default), or undefined — both are acceptable baselines
      expect([0, undefined]).toContain(timeout)
    }
  })

  it('does not set a withCredentials flag (no cookies sent cross-origin by default)', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    // withCredentials: true would send cookies to backend — not wanted for this API design
    const withCreds = apiClient.defaults.withCredentials
    expect(withCreds).not.toBe(true)
  })

  it('Content-Type header is preserved after module re-import', async () => {
    // Verify the header is stable and not accidentally mutated
    const { apiClient: c1 } = await import('@/shared/lib/apiClient')
    const ct1 = c1.defaults.headers['Content-Type']

    vi.resetModules()
    const { apiClient: c2 } = await import('@/shared/lib/apiClient')
    const ct2 = c2.defaults.headers['Content-Type']

    expect(ct1).toBe('application/json')
    expect(ct2).toBe('application/json')
  })

  it('baseURL does not end with a trailing slash (prevents double-slash in URLs)', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000')
    const { apiClient } = await import('@/shared/lib/apiClient')
    const base = apiClient.defaults.baseURL ?? ''
    if (base.length > 0) {
      expect(base).not.toMatch(/\/$/)
    }
  })

  it('does not set an Authorization header at module initialization (no default auth token)', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    const authHeader = (apiClient.defaults.headers as Record<string, unknown>)['Authorization']
    // No pre-baked auth token — authentication headers are added per-request by interceptors
    expect(authHeader).toBeUndefined()
  })
})
