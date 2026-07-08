import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/clientes')({
  component: ClientesRoute,
})

function ClientesRoute() {
  return (
    <div data-testid="clientes-view" className="flex h-full min-h-0">
      <ClienteListView />
      <section
        aria-label="Detalle del cliente"
        className="flex-1 p-6 overflow-y-auto"
      >
        {/* Story 2.2 populates the right panel — Story 2.1 exposes an Outlet
            so deep-linking to /clientes/$clienteId re-renders inside the same
            split-panel layout. */}
        <Outlet />
      </section>
    </div>
  )
}
