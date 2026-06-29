import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/')({
  component: ClientesIndexRoute,
})

function ClientesIndexRoute() {
  return <ClienteDetailView clienteId={null} style={{ height: '100%' }} />
}
