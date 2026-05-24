import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should be configured with VITE_API_URL as base URL', () => {
    // GIVEN: apiClient is imported with environment-based configuration
    // WHEN: The baseURL is read from the instance defaults
    // THEN: It matches the VITE_API_URL environment variable
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
  })

  it('should have Content-Type: application/json header', () => {
    // GIVEN: apiClient is created with JSON headers
    // WHEN: The Content-Type header is read from instance defaults
    // THEN: It is set to application/json
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
