import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ClienteListView() {
  const { data, isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClientes = useMemo(() => {
    if (!data) return []
    const q = searchQuery.toLowerCase().trim()
    if (!q) return data
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q),
    )
  }, [data, searchQuery])

  return (
    <div
      className="w-[280px] flex-shrink-0 border-r border-slate-200 flex flex-col h-full overflow-hidden"
      data-testid="cliente-list-view"
    >
      {/* Search input */}
      <div className="p-3 border-b border-slate-100">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC..."
          aria-label="Buscar clientes por nombre o NIT/RUC"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent placeholder:text-slate-400"
          data-testid="search-input"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto" role="list" aria-label="Lista de clientes">
        {isLoading && (
          <div className="p-3" aria-label="Cargando clientes" data-testid="loading-skeleton">
            <Skeleton count={5} height={56} className="mb-2" />
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState
            message={
              searchQuery
                ? 'No se encontraron clientes con ese criterio de búsqueda.'
                : 'Aún no hay clientes registrados. Crea el primer cliente para comenzar.'
            }
          />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 &&
          filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              role="listitem"
              className="flex flex-col px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              data-testid={`cliente-item-${cliente.id}`}
            >
              <span className="text-sm font-medium text-slate-900 truncate">
                {cliente.nombre}
              </span>
              <span className="text-xs text-slate-500 truncate mt-0.5">
                {cliente.nit}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
