import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  it('should be a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('should have staleTime configured to 60 seconds', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60)
  })

  it('should be a singleton — same reference on multiple imports', async () => {
    const { queryClient: queryClient2 } = await import('../queryClient')
    expect(queryClient).toBe(queryClient2)
  })
})
