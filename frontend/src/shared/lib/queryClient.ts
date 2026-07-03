import { QueryClient } from '@tanstack/react-query'

/**
 * Singleton QueryClient shared by every hook and provider in the app.
 * Default `staleTime` of 60 s prevents excessive refetches during navigation.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
    },
  },
})
