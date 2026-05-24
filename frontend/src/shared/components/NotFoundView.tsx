import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4"
    >
      <h1 className="text-4xl font-bold text-slate-800">404</h1>
      <p className="text-xl text-slate-600">Página no encontrada</p>
      <p className="text-slate-500">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        to="/clientes"
        className="mt-4 px-6 py-2 bg-[#0e79fd] text-white rounded-md hover:bg-[#154ca9] transition-colors"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
