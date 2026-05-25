import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex h-full" data-testid="clientes-page">
      <ClienteListView />
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Selecciona un cliente para ver el detalle
      </div>
    </div>
  )
}
