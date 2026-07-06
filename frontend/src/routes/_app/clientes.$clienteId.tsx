import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailRoute,
})

function ClienteDetailRoute() {
  const { clienteId } = Route.useParams()
  const navigate = useNavigate()
  return (
    <ClienteDetailView
      clienteId={clienteId}
      onDeleted={() => navigate({ to: '/clientes' })}
    />
  )
}
