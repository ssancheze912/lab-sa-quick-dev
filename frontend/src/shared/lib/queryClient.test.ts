import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'

describe('queryClient', () => {
  it('exports a singleton QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('configures a default staleTime of 60 seconds', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(60_000)
  })
})
