import { createFileRoute } from '@tanstack/react-router'
import { ClienteListPanel } from '../../modules/crm/clientes/presentation/ClienteListPanel'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView(): JSX.Element {
  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListPanel />
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        <div data-testid="cliente-detail-placeholder">Selecciona un cliente</div>
      </div>
    </div>
  )
}
