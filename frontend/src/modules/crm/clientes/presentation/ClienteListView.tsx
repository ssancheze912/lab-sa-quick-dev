import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import type { Cliente } from '../domain/Cliente'
import { ClienteListItem } from '@/shared/components/ClienteListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

interface ClienteListViewProps {
  selectedClienteId?: string
  onClienteSelect?: (cliente: Cliente) => void
  className?: string
}

export function ClienteListView({
  selectedClienteId,
  onClienteSelect,
  className = '',
}: ClienteListViewProps) {
  const { clientes, isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClientes = useMemo(() => {
    if (!clientes) return []
    if (!searchQuery.trim()) return clientes
    const query = searchQuery.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(query) ||
        c.nitRuc.toLowerCase().includes(query),
    )
  }, [clientes, searchQuery])

  function renderContent() {
    if (isLoading) {
      return (
        <div className="p-4" data-testid="client-list-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mb-3">
              <Skeleton height={16} width="80%" />
              <Skeleton height={12} width="50%" className="mt-1" />
            </div>
          ))}
        </div>
      )
    }

    if (isError) {
      return <ErrorPanel onRetry={() => refetch()} />
    }

    if (!clientes || clientes.length === 0) {
      return (
        <EmptyState
          message="Aún no hay clientes registrados"
          description="Crea el primer cliente para comenzar"
        />
      )
    }

    if (filteredClientes.length === 0) {
      return <EmptyState message="No se encontraron clientes" />
    }

    return (
      <div role="list" className="overflow-y-auto flex-1">
        {filteredClientes.map((cliente) => (
          <ClienteListItem
            key={cliente.id}
            cliente={cliente}
            isSelected={selectedClienteId === cliente.id}
            onClick={() => onClienteSelect?.(cliente)}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      data-testid="clientes-list-panel"
      className={`flex flex-col w-[280px] shrink-0 h-full border-r border-slate-200 bg-white ${className}`}
    >
      <div className="p-3 border-b border-slate-100">
        <input
          data-testid="clientes-search-input"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
        />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  )
}
