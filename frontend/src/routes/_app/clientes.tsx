import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <main
      data-testid="clientes-page"
      role="main"
      aria-label="Clientes"
      className="flex h-full"
    >
      <h1 className="sr-only">Clientes</h1>
      <ClienteListView />
      <div className="flex-1">
        {/* Right panel — ClienteDetailView added in Story 2.2 */}
      </div>
    </main>
  )
}
