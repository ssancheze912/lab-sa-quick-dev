import { isAxiosError } from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useContactoById } from '../application/useContactoById'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface Props {
  contactoId: string
}

export function ContactoDetailPanel({ contactoId }: Props) {
  const { data, isLoading, isError, error } = useContactoById(contactoId)

  const is404 = isError && isAxiosError(error) && error.response?.status === 404

  if (isLoading) {
    return (
      <div data-testid="contacto-detail-panel" className="p-6 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton width="30%" height={12} />
            <Skeleton width="60%" height={16} />
          </div>
        ))}
      </div>
    )
  }

  if (is404) {
    return (
      <div data-testid="contacto-not-found" className="p-6 text-slate-500 text-sm">
        Contacto no encontrado
      </div>
    )
  }

  if (isError) {
    return <ErrorPanel />
  }

  if (!data) return null

  return (
    <div
      data-testid="contacto-detail-panel"
      aria-label="Detalle del contacto"
      className="p-6 flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Nombre
        </span>
        <span
          data-testid="contacto-detail-nombre"
          className="text-sm font-medium text-slate-800"
        >
          {data.nombre}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Cargo
        </span>
        <span
          data-testid="contacto-detail-cargo"
          className="text-sm text-slate-700"
        >
          {data.cargo}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Teléfono
        </span>
        <span
          data-testid="contacto-detail-telefono"
          className="text-sm text-slate-700"
        >
          {data.telefono}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Email
        </span>
        <span
          data-testid="contacto-detail-email"
          className="text-sm text-slate-700"
        >
          {data.email}
        </span>
      </div>
    </div>
  )
}
