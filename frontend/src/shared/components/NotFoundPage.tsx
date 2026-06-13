import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 p-8"
      data-testid="not-found-page"
    >
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-500 text-sm">
        La ruta solicitada no existe en la aplicación.
      </p>
      <Link
        to="/clientes"
        className="text-blue-600 hover:underline text-sm font-medium"
        data-testid="not-found-link-clientes"
      >
        Ir a Clientes
      </Link>
    </div>
  )
}
