import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('should be configured with Content-Type application/json', () => {
    const contentType = apiClient.defaults.headers['Content-Type']
    expect(contentType).toBe('application/json')
  })
})
