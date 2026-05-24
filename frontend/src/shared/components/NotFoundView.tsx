import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 data-testid="not-found-message" className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link
        data-testid="not-found-return-link"
        to="/clientes"
        className="text-[#0e79fd] hover:underline"
      >
        ← Ir a Clientes
      </Link>
    </div>
  )
}
