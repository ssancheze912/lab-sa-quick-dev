import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <section
      data-testid="not-found-view"
      aria-label="Página no encontrada"
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <h1 className="text-3xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="text-base text-slate-600">La ruta solicitada no existe.</p>
      <Link
        to="/clientes"
        data-testid="not-found-link-clientes"
        className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9]"
      >
        Ir a Clientes
      </Link>
    </section>
  )
}
