import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailView,
})

function ClienteDetailView() {
  const { clienteId } = Route.useParams()

  return (
    <div data-testid="cliente-detail-view">
      <h2 className="text-2xl font-bold text-slate-900">Detalle de Cliente</h2>
      <p className="text-slate-600">{clienteId}</p>
    </div>
  )
}
