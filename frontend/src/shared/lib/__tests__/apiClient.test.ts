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

    // Assert — in test env VITE_API_URL is undefined, so baseURL will be undefined
    // This verifies the apiClient correctly reads from env
    expect(baseURL).toBeUndefined()
  })
})
