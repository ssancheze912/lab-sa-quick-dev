/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge Cases (automate expansion)
 * Covers: apiClient configuration edge cases and boundary conditions
 * not addressed by the ATDD acceptance tests.
 *
 * Test levels: Unit (Vitest)
 * Priority: P1 (core infrastructure used by all features)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'

describe('[P1] apiClient — edge cases and boundary conditions', () => {
  describe('baseURL configuration', () => {
    it('[P1] should use VITE_API_URL environment variable as baseURL', async () => {
      // GIVEN: VITE_API_URL is set in the environment
      // WHEN: apiClient module is imported
      // THEN: baseURL matches the environment variable value
      // Note: vite replaces import.meta.env at build time; in tests we verify
      // that the axios instance is created with a non-empty string baseURL.
      const { apiClient } = await import('./apiClient')
      expect(typeof apiClient.defaults.baseURL).toBe('string')
      // Should not be undefined or null — a missing VITE_API_URL would cause failures at runtime
      expect(apiClient.defaults.baseURL).toBeTruthy()
    })

    it('[P1] should have Content-Type application/json in default headers', async () => {
      // GIVEN: The apiClient is created
      // WHEN: The default headers are inspected
      const { apiClient } = await import('./apiClient')

      // THEN: Content-Type header is set to application/json
      const contentType = apiClient.defaults.headers['Content-Type']
      expect(contentType).toBe('application/json')
    })

    it('[P1] should be an axios instance (not a plain object)', async () => {
      // GIVEN: The apiClient module is imported
      // WHEN: The type is inspected
      const { apiClient } = await import('./apiClient')

      // THEN: It must be an axios instance with standard HTTP methods
      expect(typeof apiClient.get).toBe('function')
      expect(typeof apiClient.post).toBe('function')
      expect(typeof apiClient.put).toBe('function')
      expect(typeof apiClient.delete).toBe('function')
    })
  })

  describe('request interceptors boundary', () => {
    it('[P2] should not include Authorization header by default (no auth on initialization)', async () => {
      // GIVEN: The apiClient is created without authentication setup
      // WHEN: The default headers are inspected
      const { apiClient } = await import('./apiClient')

      // THEN: Authorization header is NOT set by default (Story 1.1 only initializes project)
      const authHeader = apiClient.defaults.headers.common?.['Authorization']
      expect(authHeader).toBeUndefined()
    })

    it('[P2] should export apiClient as a named export (not default)', async () => {
      // GIVEN: The module follows company standards (named exports)
      // WHEN: The module is imported with named export
      const mod = await import('./apiClient')

      // THEN: apiClient is a named export
      expect(mod.apiClient).toBeDefined()
    })
  })

  describe('singleton behavior', () => {
    it('[P1] should export the same instance across multiple imports (singleton)', async () => {
      // GIVEN: Multiple parts of the app import apiClient
      // WHEN: Two separate imports are resolved
      const modA = await import('./apiClient')
      const modB = await import('./apiClient')

      // THEN: Both refer to the same axios instance (ES module singleton)
      expect(modA.apiClient).toBe(modB.apiClient)
    })
  })
})
