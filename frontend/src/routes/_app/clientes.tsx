import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListPanel } from '../../modules/crm/clientes/presentation/ClienteListPanel'

function ClientesPage() {
  return (
    <div className="flex h-full" data-testid="clientes-view">
      <ClienteListPanel />
      <Outlet />
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})
