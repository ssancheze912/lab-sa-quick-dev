import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div data-testid="app-root">
      <Outlet />
    </div>
  ),
  notFoundComponent: () => (
    <div data-testid="not-found-page" role="main" aria-label="Página no encontrada" className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-600">La página que buscas no existe.</p>
      <Link
        to="/clientes"
        data-testid="not-found-back-link"
        className="text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Volver a Clientes"
      >
        Volver a Clientes
      </Link>
    </div>
  ),
})
