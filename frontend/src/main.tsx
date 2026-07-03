import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { routeTree } from '@/routeTree.gen'
import { NotFoundView } from '@/shared/components/NotFoundView'
import './index.css'

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundView,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element "#root" not found in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
)
