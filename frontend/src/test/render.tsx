/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Shared render helper that wires the QueryClientProvider around any tested
 * component. Each call creates a fresh `QueryClient` so caches from one test
 * do not bleed into the next.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function renderWithQueryClient(
  ui: ReactElement,
  options: {
    client?: QueryClient
    wrapperExtra?: (children: ReactNode) => ReactNode
  } & Omit<RenderOptions, 'wrapper'> = {},
): RenderResult & { queryClient: QueryClient } {
  const { client, wrapperExtra, ...rest } = options
  const queryClient = client ?? createTestQueryClient()

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const wrapped = wrapperExtra ? wrapperExtra(children) : children
    return <QueryClientProvider client={queryClient}>{wrapped}</QueryClientProvider>
  }

  const result = render(ui, { wrapper: Wrapper, ...rest })
  return { ...result, queryClient }
}
