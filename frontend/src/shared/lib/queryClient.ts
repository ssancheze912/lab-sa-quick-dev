import { QueryClient } from '@tanstack/react-query'

/**
 * Singleton TanStack QueryClient instance.
 * staleTime: 60s — minimizes redundant network requests in dev.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})
