import { describe, expect, it } from 'vitest'

import { apiClient } from './apiClient'

describe('apiClient', () => {
  it('reads baseURL from VITE_API_URL', () => {
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
  })

  it('sends JSON Content-Type by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
