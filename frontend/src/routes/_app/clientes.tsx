import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  const matchRoute = useMatchRoute()
  const hasChildRoute = matchRoute({ to: '/clientes/$clienteId', fuzzy: true })

  return (
    <div className="flex h-screen">
      <ClienteListView />
      <div data-testid="cliente-detail-panel" className="flex flex-1 items-center justify-center text-slate-400">
        {hasChildRoute ? (
          <Outlet />
        ) : (
          <p className="text-sm">Selecciona un cliente para ver sus detalles</p>
        )}
      </div>
    </div>
  )
}
