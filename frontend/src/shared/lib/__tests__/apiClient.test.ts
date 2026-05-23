import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'

describe('apiClient', () => {
  it('has JSON content-type header set', () => {
    const headers = apiClient.defaults.headers
    expect(headers['Content-Type']).toBe('application/json')
  })
})
