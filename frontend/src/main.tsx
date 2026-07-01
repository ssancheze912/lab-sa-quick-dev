import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { QueryProvider } from '@/app/providers/QueryProvider'
import { suppressKnownVendorWarnings } from '@/shared/lib/suppressKnownVendorWarnings'
import { routeTree } from './routeTree.gen'
import './index.css'

suppressKnownVendorWarnings()

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>
)
