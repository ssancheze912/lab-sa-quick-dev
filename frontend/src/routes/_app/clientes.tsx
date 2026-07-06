import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view" className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
      <p className="mt-4 text-slate-500">No hay clientes para mostrar todavía.</p>
    </div>
  )
}
