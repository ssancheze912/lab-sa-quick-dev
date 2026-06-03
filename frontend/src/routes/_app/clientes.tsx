import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full" data-testid="clientes-view">
      <ClienteListView
        onClienteSelect={(id) =>
          navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
        }
      />
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Selecciona un cliente para ver su detalle
      </div>
    </div>
  )
}
