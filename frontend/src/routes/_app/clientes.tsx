import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

function ClientesPage() {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListView
        selectedClienteId={null}
        onClienteSelect={() => {}}
      />
      <div className="flex-1" />
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})
