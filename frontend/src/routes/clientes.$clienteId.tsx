import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

function ClienteDetailRoute() {
  const { clienteId } = Route.useParams()
  return (
    <div className="flex h-full">
      <ClienteListView selectedClienteId={clienteId} />
      <section
        className="flex-1 overflow-y-auto"
        aria-label="Detalle de cliente"
      >
        <ClienteDetailView clienteId={clienteId} />
      </section>
    </div>
  )
}

export const Route = createFileRoute('/clientes/$clienteId')({
  component: ClienteDetailRoute,
})
