import { describe, it, expect } from 'vitest'
import { queryClient } from '@/shared/lib/queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  it('exports a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('has staleTime configured to 60 seconds', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(1000 * 60)
  })
})
