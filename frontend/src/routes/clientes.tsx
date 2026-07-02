import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '@/modules/crm/clientes'

export const Route = createFileRoute('/clientes')({ component: ClientesLayout })

/**
 * Layout route for /clientes and its children (/clientes/$clienteId). The
 * left-hand list panel is always mounted; the right-hand outlet renders the
 * index placeholder or the detail view depending on the active child route.
 */
function ClientesLayout() {
  return (
    <section
      data-testid="clientes-view"
      aria-labelledby="clientes-title"
      className="flex h-[calc(100dvh-56px)] lg:h-[100dvh]"
    >
      <ClienteListView />
      <Outlet />
    </section>
  )
}
