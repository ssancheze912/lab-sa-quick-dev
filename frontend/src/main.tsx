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

// NOTE: StrictMode was removed in Story 2.1 because its dev-only effect
// double-invocation broke the AC #8 contract — a single failed fetch must
// surface the ErrorPanel deterministically. The Playwright route handler
// alternates 500 → 200, and the second `useQuery` mount under StrictMode
// silently succeeded before the user could see the error. Production
// behaviour is unchanged; effects fire once in production builds either way.
createRoot(rootElement).render(
  <QueryProvider>
    <RouterProvider router={router} />
  </QueryProvider>,
)
