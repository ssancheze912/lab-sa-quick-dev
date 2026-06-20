import { createFileRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'

function ClienteDetailPlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center text-slate-400">
      <p className="text-sm">Selecciona un cliente para ver sus detalles.</p>
    </div>
  )
}

function ClientesView() {
  return (
    <div className="flex h-full">
      <ClienteListView />
      <ClienteDetailPlaceholder />
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})
