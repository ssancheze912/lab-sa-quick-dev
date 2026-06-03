import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should be an axios instance', () => {
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })

  it('should have Content-Type application/json header', () => {
    const headers = apiClient.defaults.headers
    expect(headers['Content-Type']).toBe('application/json')
  })
})
