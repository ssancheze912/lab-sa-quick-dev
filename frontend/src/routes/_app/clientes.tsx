import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/components/ClienteListView'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
  notFoundComponent: NotFoundView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListView />
      <Outlet />
    </div>
  )
}
