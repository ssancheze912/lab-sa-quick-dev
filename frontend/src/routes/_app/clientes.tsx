import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view">
      <h2 className="text-2xl font-bold text-slate-900">Clientes</h2>
    </div>
  )
}
