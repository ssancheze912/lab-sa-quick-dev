// Story 2.2: Client Detail View
// Presentation: ClienteDetailView — right panel showing full client details

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import type { AxiosError } from 'axios'
import { useCliente } from '../application/useCliente'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface ClienteDetailViewProps {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId)

  const isNotFound = isError && (error as AxiosError)?.response?.status === 404

  if (isLoading) {
    return (
      <div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-auto">
        <dl className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton height={12} width="30%" />
              <Skeleton height={16} width="60%" className="mt-1" />
            </div>
          ))}
        </dl>
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-auto">
        <p data-testid="cliente-not-found" className="text-sm text-slate-500">
          Cliente no encontrado
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-auto">
        <ErrorPanel onRetry={refetch} />
      </div>
    )
  }

  return (
    <div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-auto">
      <dl className="space-y-3">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
          <dd className="text-sm text-slate-800 mt-0.5">{data?.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
          <dd className="text-sm text-slate-800 mt-0.5">{data?.nitRuc}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd className="text-sm text-slate-800 mt-0.5">{data?.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
          <dd className="text-sm text-slate-800 mt-0.5">{data?.ciudad}</dd>
        </div>
      </dl>
    </div>
  )
}
