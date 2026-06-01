import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useParams } from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import { useCliente } from '../application/useCliente'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

export function ClienteDetailPanel() {
  const { clienteId } = useParams({ from: '/_app/clientes/$clienteId' })
  const { data: cliente, isLoading, isError, error, refetch } = useCliente(clienteId)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton height={12} width="30%" className="mb-1" />
            <Skeleton height={18} width="60%" />
          </div>
        ))}
      </div>
    )
  }

  const is404 = isError && (error as AxiosError)?.response?.status === 404

  if (is404) {
    return (
      <div className="p-6 text-slate-500 text-sm">
        Cliente no encontrado
      </div>
    )
  }

  if (isError) {
    return <ErrorPanel onRetry={() => { void refetch() }} />
  }

  if (!cliente) return null

  return (
    <div className="p-6 bg-white">
      <h2 className="text-lg font-bold text-slate-800 mb-6">{cliente.nombre}</h2>
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
