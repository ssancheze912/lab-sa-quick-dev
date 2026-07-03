import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import { isClienteNotFound, useCliente } from '../application/useCliente'
import { ClienteNotFound } from '@/shared/components/ClienteNotFound'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

interface ClienteDetailViewProps {
  clienteId: string
}

/**
 * Read-only detail view for a single cliente (Story 2.2). Bound to
 * `queryKey: ['clientes', clienteId]` via `useCliente`. Branch order:
 *   1. Loading → skeleton (data-testid="cliente-detail-skeleton").
 *   2. Error + 404 → <ClienteNotFound>.
 *   3. Error + non-404 → <ErrorPanel> with retry.
 *   4. Data available → detail body (data-testid="cliente-detail").
 *
 * The `data-testid="cliente-detail"` outer article is intentionally only
 * present on the successful-data branch — ATDD tests use it as the "data has
 * loaded" signal, so tagging the skeleton container with the same id would
 * make `findByTestId('cliente-detail')` resolve prematurely.
 */
export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId)

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-skeleton"
        className="flex-1 flex flex-col overflow-y-auto p-6 gap-4"
      >
        <Skeleton count={5} height={24} />
      </div>
    )
  }

  if (isError && isClienteNotFound(error)) {
    return <ClienteNotFound />
  }

  if (isError) {
    return <ErrorPanel onRetry={() => void refetch()} />
  }

  if (!data) {
    return (
      <div
        data-testid="cliente-detail-skeleton"
        className="flex-1 flex flex-col overflow-y-auto p-6 gap-4"
      >
        <Skeleton count={5} height={24} />
      </div>
    )
  }

  return (
    <article
      data-testid="cliente-detail"
      className="flex-1 flex flex-col overflow-y-auto p-6 gap-4"
    >
      <header className="flex flex-col gap-1">
        <h2
          data-testid="cliente-detail-nombre"
          className="text-2xl font-semibold text-slate-900"
        >
          {data.nombre}
        </h2>
        <p className="text-sm text-slate-500">NIT/RUC: {data.nitRuc}</p>
      </header>
      <dl className="grid grid-cols-1 gap-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Nombre
          </dt>
          <dd
            data-testid="cliente-detail-field-nombre"
            className="text-sm text-slate-900"
          >
            {data.nombre}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            NIT/RUC
          </dt>
          <dd
            data-testid="cliente-detail-field-nit-ruc"
            className="text-sm text-slate-900"
          >
            {data.nitRuc}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Teléfono
          </dt>
          <dd
            data-testid="cliente-detail-field-telefono"
            className="text-sm text-slate-900"
          >
            {data.telefono}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ciudad
          </dt>
          <dd
            data-testid="cliente-detail-field-ciudad"
            className="text-sm text-slate-900"
          >
            {data.ciudad}
          </dd>
        </div>
      </dl>
    </article>
  )
}
