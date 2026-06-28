import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <ClienteDetailView clienteId={undefined} />
    </div>
  )
}
