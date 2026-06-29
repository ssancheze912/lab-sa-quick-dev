import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
})

function ClientesLayout() {
  return (
    <div className="flex h-full" data-testid="clientes-view">
      <ClienteListView />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
