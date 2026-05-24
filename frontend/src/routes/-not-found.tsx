import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <div data-testid="not-found-page" className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1
        className="text-4xl font-bold text-slate-800 mb-4"
        data-testid="not-found-message"
      >
        Página no encontrada
      </h1>
      <p className="text-slate-600 mb-6">
        La ruta que buscas no existe.
      </p>
      <Link
        to="/clientes"
        data-testid="not-found-back-link"
        className="text-blue-600 hover:underline"
        aria-label="Volver a Clientes"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
