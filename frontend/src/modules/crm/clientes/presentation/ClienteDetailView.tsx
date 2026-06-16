import axios from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useCliente } from '../application/useCliente'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface ClienteDetailViewProps {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data: cliente, isLoading, isError, error, refetch } = useCliente(clienteId)

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        className="flex-1 p-6"
        data-testid="cliente-detail-panel"
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mb-4">
            <Skeleton width={80} height={14} className="mb-1" />
            <Skeleton width={200} height={18} />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    const is404 = axios.isAxiosError(error) && error.response?.status === 404
    if (is404) {
      return (
        <div
          className="flex-1 flex items-center justify-center p-6"
          data-testid="cliente-detail-panel"
        >
          <p className="text-sm text-slate-500">No se encontró el cliente solicitado.</p>
        </div>
      )
    }
    return (
      <div className="flex-1" data-testid="cliente-detail-panel">
        <ErrorPanel onRetry={() => refetch()} />
      </div>
    )
  }

  if (!cliente) return null

  return (
    <div
      className="flex-1 p-6"
      data-testid="cliente-detail-panel"
    >
      <h2 className="text-base font-bold text-slate-800 mb-4">Detalle del cliente</h2>
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
          <dd className="mt-1 text-sm text-slate-800">{cliente.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
          <dd className="mt-1 text-sm text-slate-800">{cliente.nit}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd className="mt-1 text-sm text-slate-800">{cliente.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
          <dd className="mt-1 text-sm text-slate-800">{cliente.ciudad}</dd>
        </div>
      </dl>
    </div>
  )
}
