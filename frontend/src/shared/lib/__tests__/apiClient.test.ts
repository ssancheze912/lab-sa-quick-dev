import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should be configured with VITE_API_URL as base URL', () => {
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
  })

  it('should have Content-Type: application/json header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
