import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { useClienteDetailStore } from '../../modules/crm/clientes/application/clienteDetailStore'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  const matchRoute = useMatchRoute()
  const hasChildRoute = matchRoute({ to: '/clientes/$clienteId', fuzzy: true })
  const clienteNotFound = useClienteDetailStore((s) => s.clienteNotFound)

  return (
    <div className="flex h-screen">
      {!clienteNotFound && <ClienteListView />}
      <div
        data-testid="cliente-detail-panel"
        className={`flex flex-1 text-slate-400 ${hasChildRoute ? 'flex-col' : 'items-center justify-center'}`}
      >
        {hasChildRoute ? (
          <Outlet />
        ) : (
          <p className="text-sm">Selecciona un cliente para ver sus detalles</p>
        )}
      </div>
    </div>
  )
}
