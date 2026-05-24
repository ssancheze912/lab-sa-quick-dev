// Story 2.1: Client List & Search
// Story 2.2: Client Detail View — updated to navigate on click
// Presentation: ClienteListView — left panel (280px fixed width)

import { useState, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import { ClienteListItem } from '../../../../shared/components/ClienteListItem'

interface ClienteListViewProps {
  selectedClienteId?: string
  onClienteClick?: (id: string) => void
}

export function ClienteListView({ selectedClienteId, onClienteClick }: ClienteListViewProps = {}) {
  const { data = [], isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClientes = useMemo(
    () =>
      data.filter(
        (c) =>
          c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.nitRuc.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [data, searchQuery],
  )

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] flex-shrink-0 flex flex-col h-full overflow-y-auto border-r border-slate-200"
    >
      {/* Search input */}
      <div className="p-2 border-b border-slate-200">
        <input
          type="search"
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/30 focus:border-[#0e79fd]"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <ul>
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} data-testid="skeleton-row" className="px-4 py-3">
                <Skeleton height={14} width="70%" />
                <Skeleton height={12} width="40%" className="mt-1" />
              </li>
            ))}
          </ul>
        )}

        {!isLoading && isError && (
          <ErrorPanel onRetry={refetch} />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && searchQuery === '' && (
          <EmptyState
            title="Sin clientes"
            description="Crea tu primer cliente para comenzar."
          />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul>
            {filteredClientes.map((cliente) => (
              <li key={cliente.id}>
                <ClienteListItem
                  cliente={cliente}
                  isActive={cliente.id === selectedClienteId}
                  onClick={(id) => onClienteClick?.(id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
