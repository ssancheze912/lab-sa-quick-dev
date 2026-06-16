import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  const navigate = useNavigate()

  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListView
        onSelectCliente={(id) =>
          navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
        }
      />
      <Outlet />
    </div>
  )
}
