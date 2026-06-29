import { createFileRoute } from '@tanstack/react-router'

import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/clientes/$clienteId')({
  component: ClienteDetailPage,
})

function ClienteDetailPage(): React.ReactElement {
  const { clienteId } = Route.useParams()
  // The parent `/clientes` route mounts <ClientesShell> with <ClienteListView>,
  // so this child only renders the right-pane detail view. Sharing the parent
  // layout preserves the list panel DOM node across navigations (AC #10).
  return <ClienteDetailView clienteId={clienteId} />
}
