import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
})

function ClientesLayout() {
  return (
    <section data-testid="clientes-view" className="flex h-full">
      <ClienteListView />
      <div
        data-testid="cliente-detail-placeholder"
        className="flex-1 hidden lg:flex items-center justify-center text-sm text-slate-500"
      >
        Selecciona un cliente para ver el detalle
      </div>
      <Outlet />
    </section>
  )
}
