import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailPanel } from '../../modules/crm/clientes/presentation/ClienteDetailPanel'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailRoute,
})

function ClienteDetailRoute() {
  const { clienteId } = Route.useParams()
  return <ClienteDetailPanel clienteId={clienteId} />
}
