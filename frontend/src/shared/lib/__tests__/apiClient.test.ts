import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should be defined', () => {
    expect(apiClient).toBeDefined()
  })

  it('should have Content-Type JSON header configured', () => {
    const headers = apiClient.defaults.headers
    expect(headers['Content-Type']).toBe('application/json')
  })
})
