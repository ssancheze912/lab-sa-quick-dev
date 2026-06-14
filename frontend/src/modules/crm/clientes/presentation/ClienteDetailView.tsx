import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useCliente } from '../application/useCliente'

interface ClienteDetailViewProps {
  clienteId: string | null
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading } = useCliente(clienteId)

  if (!clienteId) {
    return (
      <div
        role="status"
        className="flex-1 flex items-center justify-center text-slate-400 text-sm"
      >
        Selecciona un cliente para ver sus detalles.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6" data-testid="cliente-detail-skeleton">
        <Skeleton height={24} width="60%" className="mb-4" />
        <Skeleton count={4} height={48} className="mb-3" />
      </div>
    )
  }

  if (data === null || data === undefined) {
    return (
      <div
        role="status"
        className="flex-1 flex items-center justify-center text-slate-500 text-sm"
      >
        Cliente no encontrado.
      </div>
    )
  }

  return (
    <article
      aria-label={`Detalle del cliente ${data.nombre}`}
      className="flex-1 p-6 overflow-y-auto bg-white"
      data-testid="cliente-detail-view"
    >
      <dl className="space-y-5">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
          <dd className="text-base text-slate-800 mt-1">{data.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
          <dd className="text-base text-slate-800 mt-1">{data.nit}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd className="text-base text-slate-800 mt-1">{data.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
          <dd className="text-base text-slate-800 mt-1">{data.ciudad}</dd>
        </div>
      </dl>
    </article>
  )
}
