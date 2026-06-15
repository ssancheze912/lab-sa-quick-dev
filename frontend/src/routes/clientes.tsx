import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

function ClientesView() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <section
        className="flex-1 overflow-y-auto"
        aria-label="Detalle de cliente"
      >
        {/* Right panel — populated in Story 2.2 */}
      </section>
    </div>
  )
}

export const Route = createFileRoute('/clientes')({
  component: ClientesView,
})
