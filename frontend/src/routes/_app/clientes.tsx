import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div className="p-6" data-testid="clientes-view">
      <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
      <p className="text-slate-600 mt-2">Próximamente</p>
    </div>
  )
}
