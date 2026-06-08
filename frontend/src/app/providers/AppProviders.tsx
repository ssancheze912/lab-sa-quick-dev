import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { queryClient } from '../../shared/lib/queryClient'
import { router } from '../config/router'

interface AppProvidersProps {
  children?: ReactNode
}

export function AppProviders(_props: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
