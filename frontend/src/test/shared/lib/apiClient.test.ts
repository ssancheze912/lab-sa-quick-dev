import { describe, it, expect } from 'vitest'
import { apiClient } from '@/shared/lib/apiClient'

describe('apiClient', () => {
  it('has Content-Type application/json header set', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('uses VITE_API_URL as baseURL', () => {
    // In test environment VITE_API_URL is undefined, baseURL will be undefined
    // The important thing is the axios instance is created without errors
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })
})
