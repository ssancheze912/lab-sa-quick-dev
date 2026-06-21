import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center min-h-full p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Página no encontrada</h1>
      <p className="text-slate-600 mb-6">La ruta solicitada no existe.</p>
      <Link
        to="/clientes"
        data-testid="back-to-clientes"
        className="text-blue-600 hover:underline"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
