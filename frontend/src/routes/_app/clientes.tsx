import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div className="flex h-full" data-testid="clientes-view">
      <ClienteListView />
      <div className="flex-1 p-6">
        <p className="text-slate-400 text-sm">Seleccione un cliente para ver su detalle.</p>
      </div>
    </div>
  )
}
