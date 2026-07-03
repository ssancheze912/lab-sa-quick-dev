import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
})

function ClientesLayout() {
  return (
    <section data-testid="clientes-view" className="flex h-full">
      <ClienteListView />
      <Outlet />
    </section>
  )
}
