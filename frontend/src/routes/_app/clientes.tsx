import { createFileRoute, Outlet, useNavigate, useMatchRoute } from '@tanstack/react-router'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailPlaceholder } from '../../shared/components/ClienteDetailPlaceholder'

function ClientesView() {
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const matchedParams = matchRoute({ to: '/clientes/$clienteId', fuzzy: true })
  const hasDetail = Boolean(matchedParams)
  const selectedClienteId =
    matchedParams && typeof matchedParams === 'object' && 'clienteId' in matchedParams
      ? String((matchedParams as Record<string, unknown>).clienteId)
      : null

  const handleSelectCliente = (clienteId: string) => {
    void navigate({ to: '/clientes/$clienteId', params: { clienteId } })
  }

  return (
    <div className="flex h-full">
      <ClienteListView
        selectedClienteId={selectedClienteId}
        onSelectCliente={handleSelectCliente}
      />
      {hasDetail ? <Outlet /> : <ClienteDetailPlaceholder />}
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})
