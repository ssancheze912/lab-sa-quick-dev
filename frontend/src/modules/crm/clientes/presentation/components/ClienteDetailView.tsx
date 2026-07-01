import { isAxiosError } from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { UserCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useCliente } from '@/modules/crm/clientes/application/hooks/useCliente'

interface ClienteDetailViewProps {
  clienteId?: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error } = useCliente(clienteId)

  if (!clienteId) {
    return (
      <div
        data-testid="cliente-detail-empty"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <UserCircleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm text-slate-600">Selecciona un cliente para ver el detalle.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div data-testid="cliente-detail-loading" className="flex-1 p-6">
        <Skeleton height={28} width="40%" className="mb-4" />
        <Skeleton count={4} height={20} className="mb-3" />
      </div>
    )
  }

  const isNotFound = isError && isAxiosError(error) && error.response?.status === 404

  if (isNotFound) {
    return (
      <div
        data-testid="cliente-not-found"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <ExclamationTriangleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">Cliente no encontrado</p>
        <p className="text-sm text-slate-600">El cliente que buscas no existe o fue eliminado.</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        data-testid="cliente-not-found"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <ExclamationTriangleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">No se pudo cargar el cliente</p>
        <p className="text-sm text-slate-600">Ocurrió un error al conectar con el servidor.</p>
      </div>
    )
  }

  return (
    <div data-testid="cliente-detail-panel" className="flex-1 p-6">
      <dl className="flex flex-col gap-3">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Nombre</dt>
          <dd className="text-sm text-slate-900">{data.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">NIT/RUC</dt>
          <dd className="text-sm text-slate-900">{data.nit}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Teléfono</dt>
          <dd className="text-sm text-slate-900">{data.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Ciudad</dt>
          <dd className="text-sm text-slate-900">{data.ciudad}</dd>
        </div>
      </dl>
    </div>
  )
}
