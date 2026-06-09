import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { QueryProvider } from '../../app/providers/QueryProvider'

function ClientesPage() {
  return (
    <QueryProvider>
      <div className="flex h-full" data-testid="clientes-view">
        {/* Left panel: 280px client list */}
        <ClienteListView />
        {/* Right panel: client detail / actions */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </QueryProvider>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})
