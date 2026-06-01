import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <h1 data-testid="not-found-heading" className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link data-testid="not-found-back-link" to="/clientes" className="text-[#0e79fd] hover:underline">
        Volver a Clientes
      </Link>
    </div>
  )
}
