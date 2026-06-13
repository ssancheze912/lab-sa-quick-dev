import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryProvider } from './app/providers/QueryProvider'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Eagerly run route loaders before React renders. This ensures prefetch queries
// (e.g. GET /api/v1/clientes) are in-flight before the page's load event fires,
// so Playwright's page.goto() returns AFTER the initial network call has been
// counted by route interceptors — enabling reliable E2E assertions.
router.load().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
)
