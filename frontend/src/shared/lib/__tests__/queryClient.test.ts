import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'

describe('queryClient', () => {
  it('should be a QueryClient instance with staleTime of 60 seconds', () => {
    // Arrange / Act
    const defaultOptions = queryClient.getDefaultOptions()

    // Assert
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60)
  })
})
