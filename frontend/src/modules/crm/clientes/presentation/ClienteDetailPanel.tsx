import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClienteById } from '../application/useClienteById'

interface ClienteDetailPanelProps {
  clienteId: string
}

export function ClienteDetailPanel({ clienteId }: ClienteDetailPanelProps) {
  const { data: cliente, isLoading, isError, error } = useClienteById(clienteId)

  const is404 =
    isError &&
    (error as { response?: { status?: number } })?.response?.status === 404

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex flex-col gap-6 p-8"
      >
        <div className="flex flex-col gap-2">
          <Skeleton width="50%" height={28} />
          <Skeleton width="30%" height={16} />
        </div>
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

  if (is404) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex flex-col items-center justify-center gap-3 p-8"
      >
        <p
          data-testid="cliente-not-found"
          className="text-slate-500 text-sm text-center"
        >
          Cliente no encontrado
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex flex-col items-center justify-center gap-3 p-8"
      >
        <p className="text-slate-500 text-sm text-center">
          No se pudo cargar el detalle del cliente
        </p>
      </div>
    )
  }

  if (!cliente) return null

  return (
    <div
      data-testid="cliente-detail-panel"
      className="flex-1 flex flex-col gap-6 p-8 overflow-auto"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900">{cliente.nombre}</h2>
        <p className="text-sm text-slate-500 mt-1">{cliente.nit}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Nombre
          </span>
          <span
            data-testid="cliente-detail-nombre"
            className="text-sm text-slate-800"
          >
            {cliente.nombre}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            NIT/RUC
          </span>
          <span
            data-testid="cliente-detail-nit"
            className="text-sm text-slate-800"
          >
            {cliente.nit}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Teléfono
          </span>
          <span
            data-testid="cliente-detail-telefono"
            className="text-sm text-slate-800"
          >
            {cliente.telefono}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Ciudad
          </span>
          <span
            data-testid="cliente-detail-ciudad"
            className="text-sm text-slate-800"
          >
            {cliente.ciudad}
          </span>
        </div>
      </div>
    </div>
  )
}
