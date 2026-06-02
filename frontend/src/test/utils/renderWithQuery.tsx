/**
 * Test helper — wraps a component in a fresh TanStack QueryClientProvider
 * (with retries disabled) so each test gets isolated cache state.
 *
 * Used by every Story 2.1 component test that touches `useClientes`.
 * Exports the query client so tests can pre-warm the cache
 * (`queryClient.setQueryData(['clientes'], fixtures)`) for deterministic
 * perf assertions (TC-E2-P0-06).
 */

import type { ReactElement } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export interface RenderWithQueryResult extends RenderResult {
  queryClient: QueryClient
}

export function renderWithQuery(
  ui: ReactElement,
  options: { queryClient?: QueryClient } = {},
): RenderWithQueryResult {
  const queryClient =
    options.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    })

  const result = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )

  return { ...result, queryClient }
}
