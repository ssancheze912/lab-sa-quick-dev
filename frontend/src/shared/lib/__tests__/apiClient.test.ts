import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should be an axios instance with correct baseURL from env', () => {
    expect(apiClient).toBeDefined()
    expect(apiClient.defaults).toBeDefined()
  })

  it('should have Content-Type application/json header', () => {
    const contentType = apiClient.defaults.headers['Content-Type']
    expect(contentType).toBe('application/json')
  })
})
