import type { AxiosError } from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useCliente } from '../application/useCliente'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface ClienteDetailViewProps {
  clienteId: string | undefined
}

function ClienteDetailSkeleton() {
  return (
    <div aria-label="Cargando detalle del cliente..." className="p-6 space-y-4">
      <Skeleton height={28} width="60%" />
      <div className="space-y-2">
        <Skeleton height={12} width="30%" />
        <Skeleton height={16} width="50%" />
      </div>
      <div className="space-y-2">
        <Skeleton height={12} width="30%" />
        <Skeleton height={16} width="40%" />
      </div>
      <div className="space-y-2">
        <Skeleton height={12} width="30%" />
        <Skeleton height={16} width="45%" />
      </div>
    </div>
  )
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId)

  if (!clienteId) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <p>Selecciona un cliente para ver sus detalles</p>
      </div>
    )
  }

  if (isLoading) {
    return <ClienteDetailSkeleton />
  }

  if (isError) {
    const is404 = (error as AxiosError)?.response?.status === 404
    if (is404) {
      return (
        <div role="status" className="p-6 text-slate-500">
          El cliente no existe o fue eliminado.
        </div>
      )
    }
    return (
      <ErrorPanel
        onRetry={() => refetch()}
        message="No se pudo cargar el cliente."
      />
    )
  }

  return (
    <section
      role="region"
      aria-label="Detalle del cliente"
      className="flex flex-1 flex-col p-6"
    >
      <h2 className="text-xl font-bold text-slate-900 mb-4">{data!.nombre}</h2>
      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-slate-500">NIT/RUC</dt>
          <dd className="text-base text-slate-900">{data!.nit}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Teléfono</dt>
          <dd className="text-base text-slate-900">{data!.telefono}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Ciudad</dt>
          <dd className="text-base text-slate-900">{data!.ciudad}</dd>
        </div>
      </dl>
    </section>
  )
}
