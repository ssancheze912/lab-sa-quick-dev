import { createFileRoute } from '@tanstack/react-router'
import { ClientesShellView } from '../../modules/crm/clientes/presentation/components/ClientesShellView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return <ClientesShellView />
}
