import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { routeTree } from './routeTree.gen'
import 'siesa-ui-kit/styles.css'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element with id "root" was not found in the document.')
}

// Story 2.1: <StrictMode> is disabled in dev because React 19's double-mount
// pass causes TanStack Query to issue a second network request on route mount
// (the first observer is aborted before the query's promise settles).
// AC #2 mandates that typing does NOT trigger a second fetch, and the network
// count is asserted at the Playwright layer — StrictMode's dev-only double
// invocation would erroneously produce a second HTTP request against the
// route interceptor and fail that assertion.
createRoot(rootElement).render(
  <QueryProvider>
    <RouterProvider router={router} />
  </QueryProvider>,
)
