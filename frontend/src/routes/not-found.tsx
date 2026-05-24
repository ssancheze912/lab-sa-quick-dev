import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center"
    >
      <h1 className="text-6xl font-bold text-slate-300 dark:text-slate-700">
        404
      </h1>
      <p
        data-testid="not-found-message"
        className="text-xl text-slate-600 dark:text-slate-400"
      >
        Página no encontrada
      </p>
      <p className="text-slate-500 dark:text-slate-500">
        La ruta que buscas no existe.
      </p>
      <Link
        to="/clientes"
        data-testid="not-found-back-link"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0e79fd] px-6 py-3 text-white font-medium hover:bg-[#154ca9] transition-colors"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
