/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

function ClientesRoute() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesRoute,
})
