import { useNavigate } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { NotFoundClientePanel } from '@/shared/components/NotFoundClientePanel'
import { useCliente } from '../application/useCliente'

export interface ClienteDetailViewProps {
  clienteId: string
}

/**
 * Right-hand panel of the /clientes split view. Renders the four Cliente
 * fields (Nombre, NIT/RUC, Teléfono, Ciudad) for a given clienteId. On 404
 * shows a local NotFoundClientePanel (never crashes, never leaks internals).
 * On 5xx / network error shows a retryable ErrorPanel.
 */
export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const navigate = useNavigate()
  const { data: cliente, isLoading, isError, error, refetch } = useCliente(clienteId)

  if (isLoading) {
    return (
      <section
        data-testid="cliente-detail-skeleton"
        aria-busy="true"
        aria-label="Cargando detalle del cliente"
        className="flex flex-1 flex-col gap-3 p-6"
      >
        <Skeleton height={28} width="60%" />
        <Skeleton height={20} width="40%" />
        <Skeleton height={20} width="50%" />
        <Skeleton height={20} width="35%" />
      </section>
    )
  }

  if (isError) {
    if (error?.response?.status === 404) {
      return <NotFoundClientePanel />
    }
    return (
      <ErrorPanel
        onRetry={() => {
          void refetch()
        }}
        testId="cliente-detail-error-panel"
      />
    )
  }

  if (!cliente) {
    // Defensive: isLoading + isError already covered the pending branches.
    return null
  }

  return (
    <section
      data-testid="cliente-detail-panel"
      role="region"
      aria-labelledby="cliente-detail-title"
      className="flex flex-1 flex-col overflow-y-auto"
    >
      <header className="flex items-center gap-2 border-b border-slate-200 p-4 lg:hidden">
        <button
          type="button"
          aria-label="Volver a la lista de clientes"
          onClick={() => void navigate({ to: '/clientes' })}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Volver
        </button>
      </header>

      <div className="flex flex-col gap-6 p-6">
        <h2
          id="cliente-detail-title"
          className="text-xl font-bold text-slate-900"
        >
          {cliente.nombre}
        </h2>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              NIT/RUC
            </dt>
            <dd
              data-testid="cliente-detail-nit"
              className="mt-1 text-sm text-slate-900"
            >
              {cliente.nit}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Teléfono
            </dt>
            <dd
              data-testid="cliente-detail-telefono"
              className="mt-1 text-sm text-slate-900"
            >
              {cliente.telefono}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Ciudad
            </dt>
            <dd
              data-testid="cliente-detail-ciudad"
              className="mt-1 text-sm text-slate-900"
            >
              {cliente.ciudad}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
