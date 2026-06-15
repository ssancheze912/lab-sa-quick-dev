import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/$notFound')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link
        to="/clientes"
        data-testid="not-found-home-link"
        className="text-[#0e79fd] underline hover:text-[#154ca9] transition-colors"
        aria-label="Volver a Clientes"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
