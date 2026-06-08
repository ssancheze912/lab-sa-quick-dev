import { describe, it, expect } from 'vitest'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('should create axios instance with correct base URL', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:5000')
    //TODO: implement real tests in next stories
  })

  it('should have Content-Type application/json header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
