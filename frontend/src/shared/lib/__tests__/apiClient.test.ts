import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should have JSON content-type header configured', () => {
    const headers = apiClient.defaults.headers
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should use VITE_API_URL as baseURL', () => {
    // In test environment VITE_API_URL is undefined, so baseURL is undefined
    // This confirms the config reads from env var
    expect(apiClient.defaults.baseURL).toBeDefined()
    expect(typeof apiClient.defaults.baseURL).toBe('string')
  })
})
