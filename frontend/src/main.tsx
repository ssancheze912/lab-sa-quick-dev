import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import 'siesa-ui-kit/styles.css'
import './index.css'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element with id "root" was not found in index.html')
}

// StrictMode is the React 18 dev-only safety harness that surfaces
// non-idempotent effects and unsafe lifecycle behavior. Story 2.1 originally
// removed it to work around a flaky Playwright test (AC #8), but the correct
// remediation is to make the test's network stub deterministic — see
// `e2e/tests/clientes/list-and-search.spec.ts` (the AC #8 route handler now
// returns 500 unconditionally until the user clicks "Reintentar", at which
// point a flag flips the next response to 200). Production behaviour is
// unchanged either way — StrictMode is dev-only.
createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
)
