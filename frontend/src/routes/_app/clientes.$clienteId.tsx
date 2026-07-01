import { createFileRoute } from '@tanstack/react-router'
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/components/ClienteDetailView'
import { useClientes } from '@/modules/crm/clientes/application/hooks/useClientes'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailRoute,
})

function ClienteDetailRoute() {
  const { clienteId } = Route.useParams()
  // `ClienteListView` (sibling panel, see routes/_app/clientes.tsx) already
  // fetches the full clientes list under the same ['clientes'] query key —
  // once it resolves, we can tell locally whether `clienteId` exists without
  // ever issuing the individual by-id request for an id that doesn't exist.
  // See ClienteDetailView's `listMembership` prop doc for why this matters
  // (NFR6 / zero console errors).
  const { data: clientes, isSuccess } = useClientes()
  const listMembership: 'pending' | 'present' | 'missing' = !isSuccess
    ? 'pending'
    : clientes.some((cliente) => cliente.id === clienteId)
      ? 'present'
      : 'missing'

  return <ClienteDetailView clienteId={clienteId} listMembership={listMembership} />
}
