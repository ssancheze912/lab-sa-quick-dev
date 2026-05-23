/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit tests — apiClient additional edge cases & error paths
 *
 * Expands coverage beyond the ATDD unit tests.
 * Covers: empty string baseURL, withCredentials default, interceptors state,
 *         Content-Type format, config immutability, HTTPS URL handling.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import axios from 'axios'

async function importFreshApiClient(apiUrl: string | undefined) {
  vi.resetModules()
  vi.stubGlobal('import.meta', { env: { VITE_API_URL: apiUrl } })
  const mod = await import('../apiClient')
  return mod.apiClient
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

// ─────────────────────────────────────────────────────────────────────────────
// baseURL — edge values
// NOTE: vi.stubGlobal('import.meta') does not reliably re-evaluate ES module
// statics in Vitest's native ESM mode (same limitation as the existing ATDD
// apiClient.test.ts). These tests verify the axios.create contract directly.
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — baseURL edge values (axios.create contract)', () => {
  it('axios.create sets baseURL to the value passed (empty string)', () => {
    // Verifies the axios contract that apiClient.ts relies on
    const client = axios.create({ baseURL: '' })
    expect(client.defaults.baseURL).toBe('')
  })

  it('axios.create sets baseURL to undefined when not provided', () => {
    const client = axios.create({})
    expect(client.defaults.baseURL).toBeUndefined()
  })

  it('axios.create preserves trailing slash in baseURL', () => {
    const client = axios.create({ baseURL: 'http://localhost:5000/' })
    expect(client.defaults.baseURL).toBe('http://localhost:5000/')
  })

  it('axios.create handles HTTPS URL without modification', () => {
    const client = axios.create({ baseURL: 'https://api.siesa.com/v1' })
    expect(client.defaults.baseURL).toBe('https://api.siesa.com/v1')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Default headers — security and content negotiation
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — default headers security checks', () => {
  it('does NOT set withCredentials to true by default', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    // withCredentials should be false/undefined — cookies must not be sent cross-origin without explicit opt-in
    expect(client.defaults.withCredentials).not.toBe(true)
  })

  it('does NOT set X-Requested-With header', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    const commonHeaders = (client.defaults.headers.common as Record<string, unknown>) ?? {}
    expect(commonHeaders['X-Requested-With']).toBeUndefined()
  })

  it('does NOT include Authorization header by default', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    const commonHeaders = (client.defaults.headers.common as Record<string, unknown>) ?? {}
    expect(commonHeaders['Authorization']).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Content-Type — specific value format
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — Content-Type format', () => {
  it('Content-Type is exactly "application/json" (no charset suffix)', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    // Some libs set "application/json; charset=utf-8" — we want the clean form
    const ct = client.defaults.headers['Content-Type'] as string
    expect(ct).toBe('application/json')
    expect(ct).not.toContain('charset')
  })

  it('Content-Type value is a string, not an object', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    expect(typeof client.defaults.headers['Content-Type']).toBe('string')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Config immutability — modifying a request config does not mutate defaults
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — config immutability', () => {
  it('merging a custom timeout into a request config does not modify instance defaults', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    const originalTimeout = client.defaults.timeout

    const merged = axios.mergeConfig(client.defaults, { timeout: 5000 })

    expect(merged.timeout).toBe(5000)
    // Instance default should be unchanged
    expect(client.defaults.timeout).toBe(originalTimeout)
  })

  it('adding a custom header in request config does not pollute instance defaults', async () => {
    const client = await importFreshApiClient('http://localhost:5000')

    axios.mergeConfig(client.defaults, {
      headers: { 'X-Tenant-Id': 'test-tenant' },
    })

    // The instance-level defaults should NOT have X-Tenant-Id
    const instanceHeaders = client.defaults.headers as Record<string, unknown>
    expect(instanceHeaders['X-Tenant-Id']).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Interceptors — initial state (no interceptors registered by module)
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — interceptor initial state', () => {
  it('has zero request interceptors registered at module load time', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    // Access private handlers array via type assertion
    const interceptors = client.interceptors.request as unknown as {
      handlers: Array<unknown>
    }
    const active = (interceptors.handlers ?? []).filter(Boolean)
    expect(active).toHaveLength(0)
  })

  it('has zero response interceptors registered at module load time', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    const interceptors = client.interceptors.response as unknown as {
      handlers: Array<unknown>
    }
    const active = (interceptors.handlers ?? []).filter(Boolean)
    expect(active).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// API surface — all HTTP methods are available
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — HTTP method API surface', () => {
  it('has patch method in addition to get/post/put/delete', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    expect(typeof client.patch).toBe('function')
  })

  it('has head and options methods for preflight introspection', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    expect(typeof client.head).toBe('function')
    expect(typeof client.options).toBe('function')
  })

  it('has request method for generic HTTP calls', async () => {
    const client = await importFreshApiClient('http://localhost:5000')
    expect(typeof client.request).toBe('function')
  })
})
