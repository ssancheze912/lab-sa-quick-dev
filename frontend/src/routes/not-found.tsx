import { createFileRoute, Link } from '@tanstack/react-router'

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6" data-testid="not-found-view">
      <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
      <p className="text-slate-600 mb-6">La ruta que buscas no existe.</p>
      <Link
        to="/clientes"
        className="text-[#0e79fd] hover:underline"
        data-testid="not-found-back-link"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}

export const Route = createFileRoute('/not-found')({
  component: NotFoundPage,
})
