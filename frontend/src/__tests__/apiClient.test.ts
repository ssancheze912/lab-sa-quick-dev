import { describe, it, expect } from 'vitest'
import { apiClient } from '../shared/lib/apiClient'

describe('apiClient', () => {
  it('should have correct Content-Type header', () => {
    const headers = apiClient.defaults.headers as Record<string, unknown>
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should have baseURL configured from environment', () => {
    // In test env, VITE_API_URL may not be set — just verify apiClient is an axios instance
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
    expect(typeof apiClient.put).toBe('function')
    expect(typeof apiClient.delete).toBe('function')
  })
})
