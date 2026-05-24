import { createRootRoute, Outlet, Link } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <div data-testid="app-root">
      <Outlet />
    </div>
  )
}

function NotFoundView() {
  return (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4"
    >
      <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100">404</h1>
      <p className="text-slate-600 dark:text-slate-400">Página no encontrada</p>
      <Link
        to="/clientes"
        className="text-primary-600 dark:text-primary-400 hover:underline"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
