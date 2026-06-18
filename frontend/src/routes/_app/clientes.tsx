import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <h1 className="sr-only">Clientes</h1>
      <ClienteListView />
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex items-center justify-center p-6"
      >
        <p className="text-slate-400 text-sm">Selecciona un cliente para ver sus detalles.</p>
      </div>
    </div>
  )
}
