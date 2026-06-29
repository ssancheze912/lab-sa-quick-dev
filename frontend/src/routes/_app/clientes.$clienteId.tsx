import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClientesDetailRoute,
})

function ClientesDetailRoute() {
  const { clienteId } = Route.useParams()
  return <ClienteDetailView clienteId={clienteId} style={{ height: '100%' }} />
}
