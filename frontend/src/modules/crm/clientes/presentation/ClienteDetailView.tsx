import type { CSSProperties } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useCliente } from '../application/useCliente'

interface ClienteDetailViewProps {
  clienteId: string | null
  style?: CSSProperties
  className?: string
}

export function ClienteDetailView({ clienteId, style, className }: ClienteDetailViewProps) {
  const { data, isLoading, isError } = useCliente(clienteId)

  if (!clienteId) {
    return (
      <div
        data-testid="cliente-detail-empty"
        style={style}
        className={`flex flex-col items-center justify-center p-8 text-center ${className ?? ''}`}
      >
        <p className="text-slate-400 text-sm">Selecciona un cliente para ver sus detalles</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-skeleton"
        style={style}
        className={`p-6 ${className ?? ''}`}
      >
        <Skeleton height={28} className="mb-4" />
        <Skeleton height={20} count={4} className="mb-2" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        data-testid="cliente-detail-not-found"
        style={style}
        className={`flex flex-col items-center justify-center p-8 text-center ${className ?? ''}`}
      >
        <p className="text-slate-500 text-sm">Cliente no encontrado</p>
      </div>
    )
  }

  return (
    <div
      data-testid="cliente-detail-panel"
      style={style}
      className={`p-6 ${className ?? ''}`}
    >
      <h2 className="text-lg font-bold text-slate-800 mb-4">{data.nombre}</h2>
      <dl className="space-y-3">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
          <dd data-testid="cliente-detail-nombre" className="text-sm text-slate-800 mt-0.5">
            {data.nombre}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
          <dd data-testid="cliente-detail-nit" className="text-sm text-slate-800 mt-0.5">
            {data.nit}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd data-testid="cliente-detail-telefono" className="text-sm text-slate-800 mt-0.5">
            {data.telefono}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
          <dd data-testid="cliente-detail-ciudad" className="text-sm text-slate-800 mt-0.5">
            {data.ciudad}
          </dd>
        </div>
      </dl>
    </div>
  )
}
