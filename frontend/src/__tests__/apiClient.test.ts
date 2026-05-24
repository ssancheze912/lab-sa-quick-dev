import { describe, it, expect, beforeAll } from 'vitest'
import { apiClient } from '../shared/lib/apiClient'

describe('apiClient', () => {
  beforeAll(() => {
    // Simulate VITE_API_URL for the test environment
    // In real dev, this is set in .env.development
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(import.meta as any).env = {
      ...(import.meta.env ?? {}),
      VITE_API_URL: 'http://localhost:5000',
    }
  })

  it('should have correct Content-Type header', () => {
    const headers = apiClient.defaults.headers as Record<string, unknown>
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('should expose standard HTTP method functions (axios instance shape)', () => {
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
    expect(typeof apiClient.put).toBe('function')
    expect(typeof apiClient.delete).toBe('function')
  })
})
