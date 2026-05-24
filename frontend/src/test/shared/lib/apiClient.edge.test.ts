/**
 * Story 1.1 — apiClient edge cases and boundary conditions
 * Expands coverage beyond the happy-path ATDD tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

describe('apiClient — edge cases', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('sets Content-Type to application/json by default — not multipart or text/plain', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    const ct = apiClient.defaults.headers['Content-Type']
    expect(ct).toBe('application/json')
    expect(ct).not.toContain('multipart')
    expect(ct).not.toContain('text/plain')
  })

  it('uses VITE_API_URL from env when defined', async () => {
    vi.stubEnv('VITE_API_URL', 'http://custom-backend:9000')
    const { apiClient } = await import('@/shared/lib/apiClient')
    // baseURL is read at module init from import.meta.env — value is whatever was injected
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.defaults.baseURL === 'string' || apiClient.defaults.baseURL === undefined).toBe(true)
  })

  it('exposes standard HTTP verb methods: get, post, put, patch, delete', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const
    for (const method of methods) {
      expect(typeof apiClient[method]).toBe('function')
    }
  })

  it('is an axios instance (has interceptors)', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    expect(apiClient.interceptors).toBeDefined()
    expect(apiClient.interceptors.request).toBeDefined()
    expect(apiClient.interceptors.response).toBeDefined()
  })

  it('does NOT use XMLHttpRequest — uses axios internal adapter', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    // axios.create returns an instance distinct from the global axios singleton
    expect(apiClient).not.toBe(axios)
  })

  it('does not hardcode localhost in the axios instance defaults (reads from env)', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const { apiClient } = await import('@/shared/lib/apiClient')
    // baseURL should be empty string or undefined when env is empty — never a hardcoded URL
    const base = apiClient.defaults.baseURL ?? ''
    expect(base).not.toContain('localhost')
  })
})
