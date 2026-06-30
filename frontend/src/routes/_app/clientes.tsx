import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex h-screen">
      <ClienteListView />
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <p className="text-sm">Selecciona un cliente para ver sus detalles</p>
      </div>
    </div>
  )
}
