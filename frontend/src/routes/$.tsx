import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFoundView,
})

function NotFoundView() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <p className="text-slate-600">La ruta que buscas no existe.</p>
      <Link to="/clientes" className="text-blue-600 underline hover:text-blue-800">
        Ir a Clientes
      </Link>
    </div>
  )
}
