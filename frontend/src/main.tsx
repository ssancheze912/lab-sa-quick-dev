import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryProvider } from './app/providers/QueryProvider'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4"
    >
      <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100">404</h1>
      <p className="text-slate-600 dark:text-slate-400">Página no encontrada</p>
      <a href="/clientes" className="text-primary-600 dark:text-primary-400 hover:underline">
        Volver a Clientes
      </a>
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
)
