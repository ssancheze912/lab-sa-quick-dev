import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailRoute,
})

function ClienteDetailRoute() {
  const { clienteId } = Route.useParams()
  const router = useRouter()

  function handleClienteSelect(id: string) {
    void router.navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
  }

  return (
    <div className="flex h-full" data-testid="clientes-list-panel">
      <ClienteListView
        selectedClienteId={clienteId}
        onClienteSelect={handleClienteSelect}
      />
      <div className="flex-1">
        <ClienteDetailView clienteId={clienteId} />
      </div>
    </div>
  )
}
