import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Selecciona un cliente de la lista para ver su detalle.
      </div>
    </div>
  )
}
