import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
})

function ClientesLayout() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <div className="flex-1 flex overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

export function ClientesIndexComponent() {
  return <ClienteDetailView clienteId={undefined} />
}
