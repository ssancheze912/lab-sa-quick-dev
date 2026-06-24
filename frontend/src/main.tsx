import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ToastProvider } from 'siesa-ui-kit'
import { QueryProvider } from './app/providers/QueryProvider'
import './index.css'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <StrictMode>
    <ToastProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ToastProvider>
  </StrictMode>,
)
