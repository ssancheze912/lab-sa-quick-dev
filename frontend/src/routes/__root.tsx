import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <div data-testid="app-root" className="min-h-screen bg-white dark:bg-slate-950">
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
        Página no encontrada
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        La ruta que buscas no existe.
      </p>
      <Link
        to="/clientes"
        className="px-4 py-2 rounded-lg bg-[#0e79fd] text-white font-medium hover:bg-[#154ca9] focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:outline-none transition-colors"
      >
        Ir a Clientes
      </Link>
    </div>
  )
}
