import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'

describe('queryClient', () => {
  it('should be created with staleTime of 60 seconds', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60)
  })

  it('should export a QueryClient instance', () => {
    expect(queryClient).toBeDefined()
    expect(typeof queryClient.getDefaultOptions).toBe('function')
  })
})
