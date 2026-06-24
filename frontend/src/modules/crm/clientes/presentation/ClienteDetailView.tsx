import type { AxiosError } from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
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
      <section
        data-testid="cliente-detail-view"
        aria-label="Detalle del cliente"
        className="flex-1 p-6"
      >
        <div data-testid="cliente-detail-skeleton" className="space-y-4">
          <Skeleton height={24} />
          <Skeleton height={24} />
          <Skeleton height={24} />
          <Skeleton height={24} />
        </div>
      </section>
    )
  }

  if (isNotFound) {
    return (
      <section
        data-testid="cliente-detail-view"
        aria-label="Detalle del cliente"
        className="flex-1 p-6 flex items-center justify-center"
      >
        <p data-testid="cliente-not-found" className="text-slate-500 text-sm">
          Cliente no encontrado.
        </p>
      </section>
    )
  }

  if (isError) {
    return (
      <section
        data-testid="cliente-detail-view"
        aria-label="Detalle del cliente"
        className="flex-1"
      >
        <ErrorPanel onRetry={() => void refetch()} />
      </section>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section
      data-testid="cliente-detail-view"
      aria-label="Detalle del cliente"
      className="flex-1 p-6 space-y-4"
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</p>
        <p data-testid="cliente-detail-nombre" className="text-sm text-slate-800">
          {data.nombre}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</p>
        <p data-testid="cliente-detail-nit" className="text-sm text-slate-800">
          {data.nit}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</p>
        <p data-testid="cliente-detail-telefono" className="text-sm text-slate-800">
          {data.telefono}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</p>
        <p data-testid="cliente-detail-ciudad" className="text-sm text-slate-800">
          {data.ciudad}
        </p>
      </div>
    </section>
  )
}
