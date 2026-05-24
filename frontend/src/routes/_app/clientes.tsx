import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { z } from 'zod'

const clientesSearchSchema = z.object({
  clienteId: z.string().optional(),
})

export const Route = createFileRoute('/_app/clientes')({
  validateSearch: clientesSearchSchema,
  component: ClientesView,
})

function ClientesView() {
  const navigate = useNavigate({ from: '/clientes' })
  const { clienteId } = useSearch({ from: '/_app/clientes' })

  function handleClienteSelect(id: string) {
    void navigate({ search: { clienteId: id } })
  }

  return (
    <div className="flex h-full">
      <ClienteListView
        selectedClienteId={clienteId}
        onClienteSelect={handleClienteSelect}
      />
      <div className="flex-1 p-6 text-slate-400 flex items-center justify-center">
        {clienteId ? (
          <p className="text-sm">Selecciona un cliente para ver los detalles.</p>
        ) : (
          <p className="text-sm">Selecciona un cliente de la lista.</p>
        )}
      </div>
    </div>
  )
}
