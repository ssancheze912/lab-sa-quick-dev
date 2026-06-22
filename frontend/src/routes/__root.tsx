import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { QueryProvider } from '../app/providers/QueryProvider'

export const Route = createRootRoute({
  notFoundComponent: () => (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <Link data-testid="not-found-back-link" to="/clientes" className="text-blue-600 underline">
        Volver a Clientes
      </Link>
    </div>
  ),
  component: () => (
    <QueryProvider>
      <div id="app-root" data-testid="app-root">
        <Outlet />
      </div>
    </QueryProvider>
  ),
})
