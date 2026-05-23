import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { ClienteListPanel } from '../../modules/crm/clientes/presentation/ClienteListPanel'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { clienteId?: string }

  function handleSelectCliente(id: string) {
    void navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
  }

  return (
    <div className="flex h-full">
      <div className="w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 dark:border-slate-700">
        <ClienteListPanel
          onSelectCliente={handleSelectCliente}
          selectedClienteId={params.clienteId ?? null}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
