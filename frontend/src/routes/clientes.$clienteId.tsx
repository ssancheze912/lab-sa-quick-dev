import { createFileRoute, useParams } from '@tanstack/react-router'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

/**
 * /clientes/$clienteId route (Story 2.2).
 * Renders inside the `<Outlet />` established by Story 2.1's clientes.tsx
 * layout route — the right panel of the split view. `useParams({ from: ... })`
 * returns a typed non-nullable `clienteId: string`; the view itself validates
 * the UUID shape and branches to `ClienteNotFound` when malformed.
 */
export const Route = createFileRoute('/clientes/$clienteId')({
  component: ClienteDetailRoute,
})

function ClienteDetailRoute() {
  const { clienteId } = useParams({ from: '/clientes/$clienteId' })
  return <ClienteDetailView clienteId={clienteId} />
}
