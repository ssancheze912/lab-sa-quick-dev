import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ClienteListView() {
  const { data, isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClientes = useMemo(() => {
    if (!data) return []
    const q = searchQuery.toLowerCase()
    if (!q) return data
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  return (
    <div
      data-testid="cliente-list-panel"
      className="w-[280px] flex flex-col border-r border-slate-200 h-full overflow-hidden"
    >
      {/* Search input */}
      <div className="p-3 border-b border-slate-200">
        <input
          type="search"
          role="searchbox"
          aria-label="Buscar clientes"
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div
            data-testid="cliente-list-skeleton"
            aria-label="Cargando clientes..."
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 border-b border-slate-200">
                <Skeleton height={16} width="70%" />
                <Skeleton height={12} width="40%" className="mt-1" />
              </div>
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && data !== undefined && data.length === 0 && (
          <EmptyState message="No hay clientes aún. Crea el primero." />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul>
            {filteredClientes.map((cliente) => (
              <li key={cliente.id}>
                <ClientListItem nombre={cliente.nombre} nit={cliente.nit} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
