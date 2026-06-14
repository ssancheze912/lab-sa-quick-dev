import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
})

function ClienteDetailPage() {
  const { clienteId } = Route.useParams()
  const navigate = useNavigate()

  const handleClienteSelect = (id: string) => {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
  }

  return (
    <div className="flex h-full">
      <ClienteListView
        selectedClienteId={clienteId}
        onClienteSelect={handleClienteSelect}
      />
      <ClienteDetailView clienteId={clienteId} />
    </div>
  )
}
