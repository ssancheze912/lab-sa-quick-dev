import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/components/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/')({
  component: ClienteEmptyRoute,
})

function ClienteEmptyRoute() {
  return <ClienteDetailView />
}
