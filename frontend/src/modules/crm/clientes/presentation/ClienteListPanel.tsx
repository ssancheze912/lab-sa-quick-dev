import { useState, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import { ClientListItem } from '../../../../shared/components/ClientListItem'

export function ClienteListPanel(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isPending, isError, refetch } = useClientes()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { clienteId?: string }
  const currentClienteId = params.clienteId

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return data ?? []
    const q = searchQuery.toLowerCase()
    return (data ?? []).filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    )
  }, [data, searchQuery])

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] h-full flex flex-col border-r border-slate-200"
    >
      <div className="p-3 border-b border-slate-100">
        <input
          type="text"
          data-testid="search-input"
          placeholder="Buscar por nombre o NIT/RUC"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isPending && !isError && (
          <div data-testid="loading-skeleton" className="p-4 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton height={16} width="80%" />
                <Skeleton height={12} width="50%" />
              </div>
            ))}
          </div>
        )}

        {!isPending && isError && (
          <ErrorPanel onRetry={() => void refetch()} />
        )}

        {!isPending && !isError && data !== undefined && data.length === 0 && (
          <EmptyState message="No hay clientes registrados. Crea el primero." />
        )}

        {!isPending && !isError && filteredClientes.length > 0 && (
          <div>
            {filteredClientes.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                cliente={cliente}
                isSelected={cliente.id === currentClienteId}
                onClick={() => {
                  void navigate({ to: `/clientes/${cliente.id}` as never })
                }}
              />
            ))}
          </div>
        )}

        {!isPending && !isError && data !== undefined && data.length > 0 && filteredClientes.length === 0 && (
          <EmptyState message="No se encontraron clientes con ese criterio de búsqueda." />
        )}
      </div>
    </div>
  )
}
