import { isAxiosError } from 'axios'
import { useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useCliente } from '../application/useCliente'

export function ClienteDetailView() {
  const { clienteId } = useParams({ strict: false })
  const { data: cliente, isLoading, isError, error, refetch } = useCliente(clienteId)

  if (!clienteId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>Selecciona un cliente para ver su detalle</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-skeleton"
        role="region"
        aria-label="Cargando detalle del cliente"
        aria-busy="true"
        className="flex-1 flex flex-col gap-6 p-8"
      >
        <Skeleton height={28} width="60%" />
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton width="40%" height={12} />
              <Skeleton width="70%" height={18} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    const is404 = isAxiosError(error) && error.response?.status === 404
    if (is404) {
      return (
        <div
          data-testid="cliente-detail-panel"
          className="flex-1 flex flex-col items-center justify-center gap-3 p-8"
        >
          <p className="text-slate-500 text-sm text-center">
            Cliente no encontrado
          </p>
          <p className="text-xs text-slate-400 text-center">
            El cliente solicitado no existe o fue eliminado.
          </p>
        </div>
      )
    }
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex flex-col items-center justify-center gap-3 p-8"
      >
        <p className="text-slate-500 text-sm text-center">
          No se pudo cargar el cliente
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          aria-label="Reintentar carga del cliente"
          className="text-sm text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!cliente) return null

  return (
    <div
      data-testid="cliente-detail-panel"
      aria-label="Detalle del cliente"
      className="flex-1 flex flex-col gap-6 p-8 overflow-auto"
    >
      <h2 data-testid="cliente-detail-nombre" className="text-xl font-bold text-slate-900">{cliente.nombre}</h2>
      <dl className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            NIT/RUC
          </dt>
          <dd data-testid="cliente-detail-nit" className="text-sm text-slate-800">
            {cliente.nit}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Teléfono
          </dt>
          <dd data-testid="cliente-detail-telefono" className="text-sm text-slate-800">
            {cliente.telefono}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Ciudad
          </dt>
          <dd data-testid="cliente-detail-ciudad" className="text-sm text-slate-800">
            {cliente.ciudad}
          </dd>
        </div>
      </dl>
    </div>
  )
}
