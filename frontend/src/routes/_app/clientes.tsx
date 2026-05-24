import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view" className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Clientes
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Vista de clientes — disponible en la épica 2.
      </p>
    </div>
  )
}
