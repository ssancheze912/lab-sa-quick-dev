import { QueryClient } from '@tanstack/react-query'

/**
 * App-wide TanStack Query client.
 *
 * Defaults:
 *   - `staleTime: 60s` — cache stays fresh for one minute (matches architecture
 *     line 278: canonical `['clientes']` key + 60s stale window).
 *   - `retry: 0` — fail fast so surfaces like Story 2.1's ErrorPanel appear
 *     immediately on the first server error. Retry-on-user-action is handled
 *     explicitly via the Reintentar button (AC #5); the client-side auto-retry
 *     would otherwise hide the failure for ~15s per query.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 0,
    },
  },
})
