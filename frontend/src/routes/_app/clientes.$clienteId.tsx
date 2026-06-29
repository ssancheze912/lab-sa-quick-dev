import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClientesDetailRoute,
})

function ClientesDetailRoute() {
  const { clienteId } = Route.useParams()
  return (
    <div className="flex h-full" data-testid="clientes-view">
      <ClienteListView />
      <ClienteDetailView clienteId={clienteId} style={{ flex: 1 }} />
    </div>
  )
}
