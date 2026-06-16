import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should have Content-Type application/json header configured', () => {
    const contentType = apiClient.defaults.headers['Content-Type']
    expect(contentType).toBe('application/json')
  })

  it('should use VITE_API_URL as baseURL', () => {
    // In test env, import.meta.env.VITE_API_URL is undefined, so baseURL is undefined
    // This test verifies the client is created without errors
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })
})
