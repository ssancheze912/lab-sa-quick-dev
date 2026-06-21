import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
})

function ClientesLayout() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
        <Outlet />
      </div>
    </div>
  )
}
