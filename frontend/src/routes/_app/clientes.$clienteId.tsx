import { createFileRoute } from '@tanstack/react-router'
import { ClienteListPanel } from '@/modules/crm/clientes/presentation/ClienteListPanel'
import { ClienteDetailPanel } from '@/modules/crm/clientes/presentation/ClienteDetailPanel'

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClientesDetailRoute,
})

function ClientesDetailRoute() {
  return (
    <div className="flex h-full">
      <ClienteListPanel />
      <div className="flex-1 overflow-y-auto border-l border-slate-200">
        <ClienteDetailPanel />
      </div>
    </div>
  )
}
