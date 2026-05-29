import { describe, it, expect } from 'vitest'
import { apiClient } from '../../../shared/lib/apiClient'

describe('apiClient', () => {
  it('should have Content-Type application/json header', () => {
    const headers = apiClient.defaults.headers
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should be defined', () => {
    expect(apiClient).toBeDefined()
  })
})
