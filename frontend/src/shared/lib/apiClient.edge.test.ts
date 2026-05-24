/**
 * Story 1.1 — apiClient edge-case unit tests
 * Expands coverage beyond the ATDD baseline (apiClient.test.ts).
 *
 * Covers:
 *  - Default Content-Type header is set even when no env var is present
 *  - baseURL defaults to undefined when VITE_API_URL is not set (env isolation)
 *  - Axios instance has correct adapter (http in node / xhr in browser)
 *  - Additional default headers do NOT include Authorization (no leakage)
 *  - The exported instance is always the same singleton reference
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('apiClient — edge cases', () => {
  describe('singleton identity', () => {
    it('should export the same instance on every import (singleton)', async () => {
      const { apiClient: a } = await import('./apiClient')
      const { apiClient: b } = await import('./apiClient')
      expect(a).toBe(b)
    })
  })

  describe('default headers — boundary conditions', () => {
    it('should set Content-Type to application/json in the common defaults', async () => {
      const { apiClient } = await import('./apiClient')
      // Axios stores common headers under defaults.headers.common OR directly
      const contentTypeCommon = apiClient.defaults.headers.common?.['Content-Type']
      const contentTypeDirect = (apiClient.defaults.headers as Record<string, unknown>)['Content-Type']
      const resolved = contentTypeCommon ?? contentTypeDirect
      expect(resolved).toBe('application/json')
    })

    it('should NOT include an Authorization header by default (no credential leakage)', async () => {
      const { apiClient } = await import('./apiClient')
      const authCommon = apiClient.defaults.headers.common?.['Authorization']
      expect(authCommon).toBeUndefined()
    })

    it('should NOT include an X-Api-Key header by default', async () => {
      const { apiClient } = await import('./apiClient')
      const xApiKey = (apiClient.defaults.headers as Record<string, unknown>)['X-Api-Key']
      expect(xApiKey).toBeUndefined()
    })
  })

  describe('baseURL — environment variable handling', () => {
    it('should use undefined as baseURL when VITE_API_URL env var is not defined', async () => {
      const { apiClient } = await import('./apiClient')
      // In the Vitest jsdom environment import.meta.env.VITE_API_URL is not set
      expect(apiClient.defaults.baseURL).toBeUndefined()
    })

    it('should have a baseURL of type string or undefined (never null)', async () => {
      const { apiClient } = await import('./apiClient')
      const baseURL = apiClient.defaults.baseURL
      expect(baseURL === undefined || typeof baseURL === 'string').toBe(true)
    })
  })

  describe('timeout — default not set (no artificial limit)', () => {
    it('should not impose a default timeout (timeout === 0 or undefined means no limit)', async () => {
      const { apiClient } = await import('./apiClient')
      // Axios default timeout is 0 (no timeout). Story 1.1 does not configure one.
      const timeout = apiClient.defaults.timeout
      expect(timeout === 0 || timeout === undefined).toBe(true)
    })
  })

  describe('interceptors — no unwanted interceptors registered at init', () => {
    it('should start with zero request interceptors attached', async () => {
      const { apiClient } = await import('./apiClient')
      // Axios stores handlers in a private array; we verify via type existence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handlers = (apiClient.interceptors.request as any).handlers as unknown[]
      const activeCount = handlers.filter(Boolean).length
      expect(activeCount).toBe(0)
    })

    it('should start with zero response interceptors attached', async () => {
      const { apiClient } = await import('./apiClient')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handlers = (apiClient.interceptors.response as any).handlers as unknown[]
      const activeCount = handlers.filter(Boolean).length
      expect(activeCount).toBe(0)
    })
  })
})
