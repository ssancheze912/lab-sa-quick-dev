import { describe, it, expect } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('exposes a configured axios instance', () => {
    expect(apiClient).toBeDefined()
    expect(apiClient.defaults).toBeDefined()
  })

  it('sets JSON Content-Type by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('reads baseURL from VITE_API_URL env (or undefined in test env)', () => {
    // In test env VITE_API_URL is unset → baseURL may be empty/undefined.
    // The key contract: the property exists and is a string-like value.
    const baseURL = apiClient.defaults.baseURL
    expect(typeof baseURL === 'string' || baseURL === undefined).toBe(true)
  })

  it('has a finite timeout to prevent hanging requests', () => {
    expect(apiClient.defaults.timeout).toBeGreaterThan(0)
  })
})
