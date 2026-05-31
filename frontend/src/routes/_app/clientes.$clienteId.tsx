import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
})

function ClienteDetailPage() {
  const { clienteId } = Route.useParams()
  return (
    <main
      data-testid="clientes-page"
      role="main"
      aria-label="Clientes"
      className="flex h-full"
    >
      <h1 className="sr-only">Clientes</h1>
      <ClienteListView selectedClienteId={clienteId} />
      <div className="flex-1">
        <ClienteDetailView clienteId={clienteId} />
      </div>
    </main>
  )
}
