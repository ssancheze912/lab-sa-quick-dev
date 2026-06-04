import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 data-testid="not-found-heading" className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
        Página no encontrada
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link
        data-testid="not-found-back-link"
        to="/clientes"
        className="px-4 py-2 bg-[#0e79fd] text-white rounded hover:bg-[#154ca9] transition-colors font-medium"
      >
        Ir a Clientes
      </Link>
    </div>
  )
}
