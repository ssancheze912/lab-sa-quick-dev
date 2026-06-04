import { QueryClient } from '@tanstack/react-query'

// retry: 0 is intentional — this CRM app uses explicit user-controlled retry
// via ErrorPanel's "Reintentar" button rather than silent automatic retries.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 0,
    },
  },
})
