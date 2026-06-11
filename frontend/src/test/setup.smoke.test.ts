import { describe, it, expect } from 'vitest'
import { queryClient } from '../shared/lib/queryClient'
import { apiClient } from '../shared/lib/apiClient'

describe('Project initialization smoke tests', () => {
  it('queryClient is configured with correct stale time', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(60000)
  })

  it('apiClient instance is created', () => {
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })

  it('apiClient has JSON content-type header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
