import { createRootRoute, Outlet, Link } from '@tanstack/react-router'

function NotFoundComponent() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
      <p data-testid="not-found-message" className="text-xl text-slate-600 mb-6">Página no encontrada</p>
      <p className="text-slate-500 mb-8">
        La página que estás buscando no existe o fue movida.
      </p>
      <Link
        data-testid="not-found-back-link"
        to="/clientes"
        className="px-4 py-2 bg-[#0e79fd] text-white rounded-md hover:bg-[#154ca9] transition-colors"
      >
        Ir a Clientes
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
})
