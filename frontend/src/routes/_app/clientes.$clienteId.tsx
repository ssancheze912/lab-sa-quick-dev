/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

function ClienteDetailRoute() {
  const { clienteId } = Route.useParams()
  return <ClienteDetailView clienteId={clienteId} />
}

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailRoute,
})
