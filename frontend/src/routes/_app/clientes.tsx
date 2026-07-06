import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view" className="flex h-full flex-col">
      <h1 className="p-6 pb-0 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
        Clientes
      </h1>
      <div className="flex flex-1 overflow-hidden p-6">
        <ClienteListView />
        <div data-testid="cliente-detail-panel" className="flex flex-1 items-center justify-center">
          <p className="text-slate-500">Selecciona un cliente para ver su detalle</p>
        </div>
      </div>
    </div>
  )
}
