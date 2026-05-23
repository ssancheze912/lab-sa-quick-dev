import axios from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useCliente } from '../application/useCliente'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface ClienteDetailPanelProps {
  clienteId: string
}

export function ClienteDetailPanel({ clienteId }: ClienteDetailPanelProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId)

  const isNotFound =
    isError && axios.isAxiosError(error) && error.response?.status === 404

  return (
    <div
      data-testid="cliente-detail-panel"
      role="region"
      aria-label="Detalle del cliente"
      className="p-6"
    >
      {isLoading && (
        <div>
          <Skeleton height={24} className="mb-4" />
          <Skeleton height={24} className="mb-4" />
          <Skeleton height={24} className="mb-4" />
          <Skeleton height={24} className="mb-4" />
        </div>
      )}

      {!isLoading && isNotFound && (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
          Cliente no encontrado.
        </p>
      )}

      {!isLoading && isError && !isNotFound && (
        <ErrorPanel onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && data && (
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Nombre
            </dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100">
              {data.nombre}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              NIT/RUC
            </dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100">
              {data.nit}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Teléfono
            </dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100">
              {data.telefono}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ciudad
            </dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100">
              {data.ciudad}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}
