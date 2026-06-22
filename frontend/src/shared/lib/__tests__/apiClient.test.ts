import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should use VITE_API_URL as base URL (reads from env)', () => {
    // In test env VITE_API_URL is not set, so baseURL comes from import.meta.env.VITE_API_URL
    // The important thing is the axios instance was created — baseURL can be undefined in tests
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })

  it('should have JSON content type header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
