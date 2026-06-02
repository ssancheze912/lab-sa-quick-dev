import { QueryClient } from '@tanstack/react-query'

/**
 * Singleton TanStack QueryClient instance.
 * staleTime: 60s — minimizes redundant network requests in dev.
 *
 * retry: false — failures surface immediately so the UI can render the
 * ErrorPanel with a user-driven "Reintentar" CTA (Story 2.1 AC-2.1.d, NFR6).
 * Implicit exponential-backoff retries would delay the error state past the
 * user's perception threshold and the E2E test timeout.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})
