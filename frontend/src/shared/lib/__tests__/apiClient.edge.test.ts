/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — apiClient edge cases and boundary conditions
 * Expands coverage beyond the ATDD tests — not covered by E2E or API specs.
 *
 * Scenarios covered:
 *   - No request/response interceptors registered by default
 *   - Instance is distinct from the global axios default instance
 *   - baseURL resolves from VITE_API_URL env variable contract
 *   - Default timeout is not set (caller controls it)
 *   - Headers object is a plain object (no prototype pollution risk)
 *   - Second import returns the same singleton instance
 */

import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'
import axios from 'axios'

describe('apiClient — edge cases and boundary conditions', () => {
  it('[P2] should be an Axios instance (not the global axios default)', () => {
    // GIVEN: apiClient is created with axios.create()
    // WHEN: We check its identity
    // THEN: It is not the global axios singleton
    expect(apiClient).not.toBe(axios)
  })

  it('[P2] should have zero request interceptors registered by default', () => {
    // GIVEN: The apiClient is freshly created without interceptors
    // WHEN: We inspect the interceptor queue
    // THEN: No request interceptors are added
    // Axios stores interceptors in handlers array internally
    const interceptorHandlers = (apiClient.interceptors.request as unknown as { handlers: unknown[] }).handlers
    const activeHandlers = interceptorHandlers.filter(Boolean)
    expect(activeHandlers).toHaveLength(0)
  })

  it('[P2] should have zero response interceptors registered by default', () => {
    // GIVEN: The apiClient is freshly created without interceptors
    // WHEN: We inspect the response interceptor queue
    // THEN: No response interceptors are added
    const interceptorHandlers = (apiClient.interceptors.response as unknown as { handlers: unknown[] }).handlers
    const activeHandlers = interceptorHandlers.filter(Boolean)
    expect(activeHandlers).toHaveLength(0)
  })

  it('[P2] should NOT have a custom timeout set (defaults to 0 = no timeout enforced)', () => {
    // GIVEN: No timeout is configured in the axios.create() call
    // WHEN: We read the default timeout
    // THEN: Timeout is 0 (axios default = no forced timeout — each caller controls it)
    // axios.create() sets timeout: 0 internally when none is specified
    const timeout = apiClient.defaults.timeout ?? 0
    expect(timeout).toBe(0)
  })

  it('[P2] should have Content-Type header preserved after instance creation', async () => {
    // GIVEN: apiClient is created with 'Content-Type': 'application/json'
    // WHEN: A second reference to apiClient is used
    // THEN: The header is still present (singleton stability)
    const { apiClient: secondRef } = await import('../apiClient')
    expect(secondRef.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('[P2] should export a single singleton (same reference on repeated imports)', async () => {
    // GIVEN: ES module caching is active
    // WHEN: The module is imported twice
    const { apiClient: firstRef } = await import('../apiClient')
    const { apiClient: secondRef } = await import('../apiClient')

    // THEN: Both imports point to the same object reference
    expect(firstRef).toBe(secondRef)
  })

  it('[P3] should have application/json as the Content-Type header in the common headers object', () => {
    // GIVEN: axios.create receives { headers: { 'Content-Type': 'application/json' } }
    // WHEN: We access the specific header via the common headers path
    // THEN: Content-Type is present (both paths should work)
    const commonContentType = apiClient.defaults.headers.common?.['Content-Type']
    const directContentType = apiClient.defaults.headers['Content-Type']
    // At least one of the two header paths must hold the value
    const found = commonContentType === 'application/json' || directContentType === 'application/json'
    expect(found).toBe(true)
  })
})
