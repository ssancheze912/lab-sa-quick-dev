import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-600">La página que buscas no existe o fue movida.</p>
      <Link
        to="/clientes"
        data-testid="not-found-recovery-link"
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
