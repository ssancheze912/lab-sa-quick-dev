import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
})

function ClienteDetailPage() {
  const { clienteId } = Route.useParams()
  const navigate = useNavigate()

  return (
    <div data-testid="clientes-detail-view" className="flex h-full">
      <ClienteListView
        selectedClienteId={clienteId}
        onSelectCliente={(id) =>
          navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
        }
      />
      <ClienteDetailView clienteId={clienteId} />
    </div>
  )
}
