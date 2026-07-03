import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { queryClient } from '@/shared/lib/queryClient'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Wraps the app with the shared TanStack Query client so any hook can call
 * `useQuery` / `useMutation`.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
