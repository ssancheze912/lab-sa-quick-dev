import { describe, it, expect } from 'vitest'
import { apiClient } from '../shared/lib/apiClient'
import { queryClient } from '../shared/lib/queryClient'
import { queryClient as queryClient2 } from '../shared/lib/queryClient'

describe('Project Setup - AC1, AC4', () => {
  it('apiClient has JSON content-type header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('apiClient instance is created from axios', () => {
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })

  it('queryClient has staleTime configured', () => {
    const queryDefaults = queryClient.getDefaultOptions()
    expect(queryDefaults.queries?.staleTime).toBe(1000 * 60)
  })

  it('queryClient is a singleton (same instance on re-import)', () => {
    expect(queryClient).toBe(queryClient2)
  })
})
