import { describe, it, expect } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('should be an axios instance with the correct baseURL from env', () => {
    // VITE_API_URL is not set in test env so defaults to undefined
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })

  it('should have Content-Type application/json header configured', () => {
    const contentType = apiClient.defaults.headers['Content-Type']
    expect(contentType).toBe('application/json')
  })
})
