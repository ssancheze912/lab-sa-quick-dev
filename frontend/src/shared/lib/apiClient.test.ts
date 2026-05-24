import { describe, it, expect } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('has correct Content-Type header', () => {
    const headers = apiClient.defaults.headers
    expect(headers['Content-Type']).toBe('application/json')
  })
})
