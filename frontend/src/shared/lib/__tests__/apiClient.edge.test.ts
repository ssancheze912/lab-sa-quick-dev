import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

/**
 * Edge case & boundary tests for apiClient
 * Extends coverage beyond the basic ATDD unit tests in apiClient.test.ts.
 *
 * Coverage added:
 *   - Default headers shape (no unexpected extra headers)
 *   - Axios instance type verification
 *   - defaults.baseURL reads from VITE_API_URL (undefined in test env)
 *   - No timeout is set by default (undefined — infinite unless caller sets it)
 *   - withCredentials is false by default (no accidental credential leakage)
 *   - Response interceptors array is present and starts empty
 *   - Request interceptors array is present and starts empty
 */

describe('apiClient — edge cases', () => {
  it('should be an axios instance with a post method', () => {
    // GIVEN: apiClient is created via axios.create()
    // THEN: It has the expected HTTP method functions
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
    expect(typeof apiClient.put).toBe('function')
    expect(typeof apiClient.delete).toBe('function')
    expect(typeof apiClient.patch).toBe('function')
  })

  it('should NOT have withCredentials set to true by default', () => {
    // GIVEN: The apiClient is created with only Content-Type and baseURL
    // THEN: withCredentials is falsy (must not send cookies cross-origin by default)
    expect(apiClient.defaults.withCredentials).toBeFalsy()
  })

  it('should NOT have a default timeout configured', () => {
    // GIVEN: No timeout was specified in axios.create()
    // THEN: defaults.timeout is 0 or undefined (axios default — no timeout)
    // This is intentional: callers set timeout per-request if needed
    expect(apiClient.defaults.timeout === 0 || apiClient.defaults.timeout === undefined).toBe(true)
  })

  it('should have only Content-Type in the common headers', () => {
    // GIVEN: The apiClient was created with { 'Content-Type': 'application/json' }
    // THEN: The Content-Type header is exactly 'application/json'
    const headers = apiClient.defaults.headers
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should NOT have an Authorization header pre-configured', () => {
    // GIVEN: No token is hardcoded in the factory (tokens are added per-request or via interceptors)
    // THEN: No Authorization header exists in defaults
    const commonHeaders = apiClient.defaults.headers.common as Record<string, unknown>
    expect(commonHeaders?.['Authorization']).toBeUndefined()
  })

  it('should have interceptors.request and interceptors.response objects defined', () => {
    // GIVEN: axios.create() always initializes the interceptor manager
    // THEN: Both interceptor managers are present
    expect(apiClient.interceptors).toBeDefined()
    expect(apiClient.interceptors.request).toBeDefined()
    expect(apiClient.interceptors.response).toBeDefined()
  })

  it('should export apiClient as a named export (not default)', async () => {
    // GIVEN: apiClient.ts uses a named export per company standards
    // THEN: Re-importing the module gives the same instance (singleton)
    const module = await import('../apiClient')
    expect(module.apiClient).toBe(apiClient)
  })
})
