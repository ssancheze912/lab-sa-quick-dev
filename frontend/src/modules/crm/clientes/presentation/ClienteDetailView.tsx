import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useCliente } from '../application/useCliente'
import { useClienteDetailStore } from '../application/clienteDetailStore'

interface ClienteDetailViewProps {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError } = useCliente(clienteId)
  const setClienteNotFound = useClienteDetailStore((s) => s.setClienteNotFound)

  useEffect(() => {
    setClienteNotFound(!isLoading && (isError || !data))
    return () => {
      setClienteNotFound(false)
    }
  }, [isLoading, isError, data, setClienteNotFound])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6">
          <Skeleton height={24} width="60%" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-4">
            <Skeleton height={12} width="30%" className="mb-1" />
            <Skeleton height={16} width="70%" />
          </div>
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div data-testid="cliente-not-found" className="flex flex-1 flex-col items-center justify-center text-slate-500">
        <p className="text-sm">No se encontró el cliente solicitado.</p>
      </div>
    )
  }

  return (
    <div data-testid="cliente-detail-content" className="flex flex-1 flex-col p-6">
      <h2 className="mb-6 text-lg font-bold text-slate-900">{data.nombre}</h2>
      <dl className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-slate-900">Nombre</dt>
          <dd className="text-sm text-slate-700">{data.nombre}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-900">NIT/RUC</dt>
          <dd className="text-sm text-slate-700">{data.nit}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-900">Teléfono</dt>
          <dd className="text-sm text-slate-700">{data.telefono}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-900">Ciudad</dt>
          <dd className="text-sm text-slate-700">{data.ciudad}</dd>
        </div>
      </dl>
    </div>
  )
}
