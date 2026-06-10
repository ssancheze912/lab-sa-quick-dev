import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock environment variable
vi.stubEnv('VITE_API_URL', 'http://localhost:5000')

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should create an axios instance with the correct baseURL from env', async () => {
    const { apiClient } = await import('../apiClient')
    expect(apiClient.defaults.baseURL).toBe('http://localhost:5000')
  })

  it('should have Content-Type header set to application/json', async () => {
    const { apiClient } = await import('../apiClient')
    const contentType = (apiClient.defaults.headers as Record<string, unknown>)['Content-Type']
    expect(contentType).toBe('application/json')
  })
})
