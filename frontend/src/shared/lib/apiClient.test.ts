import { describe, it, expect } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('uses the API URL from VITE_API_URL env var', () => {
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
  })

  it('sets the JSON content-type header by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
