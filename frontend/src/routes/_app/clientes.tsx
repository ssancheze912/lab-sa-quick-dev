import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex flex-row h-full" data-testid="clientes-view">
      <ClienteListView />
      <div className="flex-1" data-testid="cliente-detail-placeholder">
        {/* Story 2.2 renders ClienteDetailView here */}
      </div>
    </div>
  )
}
