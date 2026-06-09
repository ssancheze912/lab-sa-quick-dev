import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { ExclamationTriangleIcon, UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundView,
  errorComponent: DefaultErrorView,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Outlet />
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="flex min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop rail (visible only on lg+) */}
      <aside
        data-testid="navigation-rail-wrapper"
        className="hidden lg:flex lg:w-[72px] lg:flex-col lg:border-r lg:border-slate-200"
      >
        <nav
          aria-label="Navegación principal"
          className="flex flex-1 flex-col gap-1 py-4"
        >
          <Link
            to="/clientes"
            data-testid="nav-rail-clientes"
            aria-label="Clientes"
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <UsersIcon className="h-5 w-5" />
            <span>Clientes</span>
          </Link>
          <Link
            to="/contactos"
            data-testid="nav-rail-contactos"
            aria-label="Contactos"
            className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <UserIcon className="h-5 w-5" />
            <span>Contactos</span>
          </Link>
        </nav>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-[#0e79fd]" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Página no encontrada
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          La ruta solicitada no existe.
        </p>
        <Link
          to="/clientes"
          className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154ca9]"
        >
          Ir a Clientes
        </Link>
      </main>

      {/* Mobile bottom bar (visible only below lg) */}
      <nav
        data-testid="navigation-bar-wrapper"
        aria-label="Navegación inferior"
        className="fixed inset-x-0 bottom-0 z-50 flex h-14 border-t border-slate-200 bg-white lg:hidden"
      >
        <Link
          to="/clientes"
          data-testid="nav-bar-clientes"
          aria-label="Clientes"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-500"
        >
          <UsersIcon className="h-5 w-5" />
          <span>Clientes</span>
        </Link>
        <Link
          to="/contactos"
          data-testid="nav-bar-contactos"
          aria-label="Contactos"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-500"
        >
          <UserIcon className="h-5 w-5" />
          <span>Contactos</span>
        </Link>
      </nav>
    </div>
  )
}

function DefaultErrorView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Ha ocurrido un error
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        Por favor intenta nuevamente.
      </p>
      <Link
        to="/clientes"
        className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154ca9]"
      >
        Ir a Clientes
      </Link>
    </div>
  )
}
