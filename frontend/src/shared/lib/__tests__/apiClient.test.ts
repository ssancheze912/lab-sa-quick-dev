import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should have Content-Type application/json header configured', () => {
    // Arrange / Act
    const headers = apiClient.defaults.headers

    // Assert
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should have baseURL configured from VITE_API_URL env var', () => {
    // Arrange / Act
    const baseURL = apiClient.defaults.baseURL

    // Assert — baseURL is set from VITE_API_URL (http://localhost:5000 in test env)
    // This verifies the apiClient correctly reads from env
    expect(baseURL).toBe('http://localhost:5000')
  })
})
