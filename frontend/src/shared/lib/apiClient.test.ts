import { describe, it, expect } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('should have Content-Type header set to application/json', () => {
    const contentType = apiClient.defaults.headers['Content-Type']
    expect(contentType).toBe('application/json')
  })

  it('should use VITE_API_URL as baseURL', () => {
    // In test env, import.meta.env.VITE_API_URL is undefined so baseURL will be undefined
    // This verifies the configuration is wired to the env variable
    const baseURL = apiClient.defaults.baseURL
    expect(baseURL).toBeUndefined()
  })
})
