import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should be an axios instance with correct defaults', () => {
    expect(apiClient).toBeDefined()
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
