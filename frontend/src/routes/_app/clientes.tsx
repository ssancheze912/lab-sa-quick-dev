import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <h1 className="sr-only">Clientes</h1>
      <ClienteListView />
      {/* Right panel: empty placeholder — Story 2.2 */}
      <div className="flex-1" />
    </div>
  )
}
