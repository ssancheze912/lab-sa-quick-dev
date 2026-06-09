import { createRootRoute, Outlet, Link } from '@tanstack/react-router'

function NotFoundComponent() {
  return (
    <div
      role="main"
      className="flex flex-col items-center justify-center min-h-screen gap-4 text-slate-700"
    >
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="text-lg">Página no encontrada</p>
      <Link
        to="/clientes"
        className="text-[#0e79fd] underline hover:text-[#154ca9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0e79fd]"
      >
        Volver al inicio
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundComponent,
})
