import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
})

function ClientesLayout() {
  return (
    <div className="flex flex-row h-full" data-testid="clientes-view">
      <ClienteListView />
      <div className="flex-1 flex">
        <Outlet />
      </div>
    </div>
  )
}
