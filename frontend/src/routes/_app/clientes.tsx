import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListView />
      <main className="flex-1 overflow-auto bg-slate-50" />
    </div>
  )
}
