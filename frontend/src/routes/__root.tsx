import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <div data-testid="app-root">
      <Outlet />
    </div>
  )
}

function NotFoundPage() {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen gap-4 text-center p-6"
      data-testid="not-found-view"
    >
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="text-lg text-slate-600">Página no encontrada</p>
      <Link
        to="/clientes"
        className="text-blue-600 underline hover:text-blue-800"
        data-testid="not-found-back-link"
      >
        Ir a Clientes
      </Link>
    </div>
  )
}
