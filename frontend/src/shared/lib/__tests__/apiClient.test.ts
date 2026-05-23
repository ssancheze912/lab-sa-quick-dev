/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit tests — apiClient (Axios instance)
 *
 * Covers:
 *   - Happy path: correct default headers and baseURL
 *   - Edge cases: missing env variable, header override, singleton identity
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import axios from 'axios'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-import apiClient in an isolated module scope so we can vary import.meta.env
 * between tests without polluting the module cache.
 */
async function importApiClient(apiUrl: string | undefined) {
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
// Default configuration — happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — default configuration', () => {
  it('has Content-Type application/json set as default header', () => {
    // GIVEN: The module is imported under normal conditions
    // WHEN: We inspect the Axios instance defaults
    const { apiClient } = await (async () => {
      const mod = await import('../apiClient')
      return mod
    })()
    const headers = apiClient.defaults.headers
    // THEN: Content-Type is set to application/json
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('is an Axios instance (has get method)', async () => {
    const { apiClient } = await import('../apiClient')
    expect(typeof apiClient.get).toBe('function')
  })

  it('is an Axios instance (has post method)', async () => {
    const { apiClient } = await import('../apiClient')
    expect(typeof apiClient.post).toBe('function')
  })

  it('is an Axios instance (has put method)', async () => {
    const { apiClient } = await import('../apiClient')
    expect(typeof apiClient.put).toBe('function')
  })

  it('is an Axios instance (has delete method)', async () => {
    const { apiClient } = await import('../apiClient')
    expect(typeof apiClient.delete).toBe('function')
  })

  it('exports a named apiClient symbol (not a default export)', async () => {
    const mod = await import('../apiClient')
    expect(mod).toHaveProperty('apiClient')
    expect(mod.apiClient).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// baseURL — derived from VITE_API_URL env variable
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — baseURL from VITE_API_URL', () => {
  it('uses http://localhost:5000 as baseURL when VITE_API_URL is set', async () => {
    // GIVEN: VITE_API_URL is set to http://localhost:5000
    // WHEN: apiClient is created
    const client = await importApiClient('http://localhost:5000')
    // THEN: baseURL matches the env variable
    expect(client.defaults.baseURL).toBe('http://localhost:5000')
  })

  it('uses a custom baseURL when VITE_API_URL points to a staging URL', async () => {
    const client = await importApiClient('https://api.staging.siesa.com')
    expect(client.defaults.baseURL).toBe('https://api.staging.siesa.com')
  })

  it('sets baseURL to undefined when VITE_API_URL is not defined', async () => {
    // GIVEN: VITE_API_URL is missing (undefined)
    // WHEN: apiClient module is loaded
    const client = await importApiClient(undefined)
    // THEN: baseURL is undefined (Axios will use relative URLs)
    expect(client.defaults.baseURL).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Singleton identity
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — singleton identity', () => {
  it('returns the same instance on multiple imports within the same module scope', async () => {
    // GIVEN: Two callers import apiClient from the same cached module
    const mod1 = await import('../apiClient')
    const mod2 = await import('../apiClient')
    // THEN: Both references point to the identical object
    expect(mod1.apiClient).toBe(mod2.apiClient)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Header behavior — boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('apiClient — header boundary conditions', () => {
  it('per-request Content-Type override is applied in merged config', async () => {
    const { apiClient } = await import('../apiClient')
    // Simulate a call config that overrides Content-Type
    const requestConfig = axios.mergeConfig(apiClient.defaults, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // THEN: The per-request override exists in the merged config
    expect(requestConfig.headers['Content-Type']).toBe('multipart/form-data')
  })

  it('instance default Content-Type is unchanged after per-request override', async () => {
    const { apiClient } = await import('../apiClient')
    const originalContentType = apiClient.defaults.headers['Content-Type']
    axios.mergeConfig(apiClient.defaults, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // THEN: The instance default remains unchanged
    expect(apiClient.defaults.headers['Content-Type']).toBe(originalContentType)
  })

  it('does NOT include Authorization header by default (no credentials pre-set)', async () => {
    const { apiClient } = await import('../apiClient')
    const commonHeaders = apiClient.defaults.headers.common ?? {}
    expect(commonHeaders['Authorization']).toBeUndefined()
  })
})
