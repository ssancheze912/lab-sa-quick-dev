import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, isError, refetch } = useClientes()

  const filteredClientes = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    )
  }, [data, searchQuery])

  return (
    <div
      data-testid="cliente-list-view"
      className="w-[280px] flex-shrink-0 h-full flex flex-col border-r border-slate-200"
    >
      <div className="p-3 border-b border-slate-200">
        <input
          data-testid="search-input"
          type="text"
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
        />
      </div>

      <div
        className="flex-1 overflow-y-auto"
        aria-busy={isLoading}
      >
        {isLoading && (
          <div className="p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-1">
                <Skeleton height={16} className="mb-1" />
                <Skeleton height={12} width="60%" />
              </div>
            ))}
          </div>
        )}

        {isError && <ErrorPanel onRetry={refetch} />}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul>
            {filteredClientes.map((cliente) => (
              <li key={cliente.id}>
                <ClientListItem cliente={cliente} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
