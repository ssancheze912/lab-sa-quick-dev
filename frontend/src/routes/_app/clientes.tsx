/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

function ClientesRoute() {
  const navigate = useNavigate()
  const { clienteId: selectedClienteId } = useParams({ strict: false }) as { clienteId?: string }

  return (
    <div className="flex h-full">
      <ClienteListView
        selectedClienteId={selectedClienteId}
        onClienteClick={(id) =>
          navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
        }
      />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesRoute,
})
