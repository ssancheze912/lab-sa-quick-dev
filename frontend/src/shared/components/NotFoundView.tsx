import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center h-full gap-4 p-8"
    >
      <h1 className="text-4xl font-bold text-slate-700">404</h1>
      <p className="text-slate-500">Página no encontrada</p>
      <p className="text-slate-400 text-sm">La ruta solicitada no existe.</p>
      <Link to="/clientes" className="text-primary underline">
        Ir a Clientes
      </Link>
    </div>
  )
}
