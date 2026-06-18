import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListView />
      <div className="flex-1 p-6">
        <h1 className="sr-only">Clientes</h1>
        {/* Placeholder for Story 2.2: Client Detail View */}
      </div>
    </div>
  )
}
