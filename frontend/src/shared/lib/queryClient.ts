import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      // Manual retry only (ErrorPanel "Reintentar" button per architecture's
      // error-handling rule) — automatic retries would mask/delay the error
      // state behind React Query's exponential backoff.
      retry: false,
    },
  },
})
