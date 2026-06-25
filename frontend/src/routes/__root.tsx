import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

function NotFoundComponent() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p data-testid="not-found-message" className="text-xl text-slate-700">
        Página no encontrada
      </p>
      <Link to="/clientes" data-testid="not-found-back-link" className="text-[#0e79fd] underline">
        Ir a Clientes
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  component: () => (
    <div data-testid="app-root" className="flex min-h-screen">
      <Outlet />
    </div>
  ),
  notFoundComponent: NotFoundComponent,
})
