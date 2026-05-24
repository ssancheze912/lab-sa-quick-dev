import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div data-testid="app-root">
      <Outlet />
    </div>
  ),
  notFoundComponent: () => (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center h-full gap-4 p-8"
    >
      <h1 className="text-xl font-bold text-slate-800">Página no encontrada</h1>
      <Link to="/clientes" className="text-[#0e79fd] hover:underline">
        Ir a Clientes
      </Link>
    </div>
  ),
})
