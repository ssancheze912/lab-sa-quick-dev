import { describe, it, expect } from 'vitest'
import { queryClient } from './queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('has staleTime of 60 seconds', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(60000)
  })
})
