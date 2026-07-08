import { describe, expect, it } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('sets JSON headers by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
    expect(apiClient.defaults.headers['Accept']).toBe('application/json')
  })

  it('uses VITE_API_URL as baseURL', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:5000')
  })
})
