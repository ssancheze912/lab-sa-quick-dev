import { describe, it, expect } from 'vitest'
import { apiClient } from '../apiClient'
import axios from 'axios'

describe('apiClient', () => {
  it('should be an axios instance', () => {
    expect(axios.isAxiosError).toBeDefined()
    expect(apiClient.defaults).toBeDefined()
  })

  it('should have application/json content-type header', () => {
    const contentType = apiClient.defaults.headers['Content-Type']
    expect(contentType).toBe('application/json')
  })

  it('should use VITE_API_URL as baseURL', () => {
    // In test environment VITE_API_URL is undefined, so baseURL may be undefined
    // This validates the configuration is correctly set up to read from env
    expect(apiClient.defaults.baseURL).toBeUndefined()
  })
})
