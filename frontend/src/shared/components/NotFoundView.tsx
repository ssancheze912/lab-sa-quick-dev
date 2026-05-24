import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link to="/clientes" className="text-[#0e79fd] hover:underline">
        ← Ir a Clientes
      </Link>
    </div>
  )
}
