import { useState, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import type { Cliente } from '../domain/Cliente'

interface ClienteListItemProps {
  cliente: Cliente
  isSelected: boolean
  onClick: (id: string) => void
}

function ClienteListItem({ cliente, isSelected, onClick }: ClienteListItemProps) {
  return (
    <li
      role="listitem"
      data-testid="cliente-list-item"
      aria-current={isSelected ? 'page' : undefined}
      tabIndex={0}
      onClick={() => onClick(cliente.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(cliente.id)}
      className={`cursor-pointer px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e79fd] ${
        isSelected ? 'border-l-2 border-[#0e79fd] bg-blue-50 dark:bg-slate-800' : ''
      }`}
    >
      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {cliente.nombre}
      </p>
      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
        {cliente.nit}
      </p>
    </li>
  )
}

interface ClienteListPanelProps {
  onSelectCliente?: (id: string) => void
  selectedClienteId?: string | null
}

export function ClienteListPanel({
  onSelectCliente,
  selectedClienteId,
}: ClienteListPanelProps = {}) {
  const { data: clientes = [], isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null)

  const selectedId = selectedClienteId !== undefined ? selectedClienteId : localSelectedId

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clientes
    const q = searchQuery.toLowerCase()
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
    )
  }, [clientes, searchQuery])

  function handleClick(id: string) {
    setLocalSelectedId(id)
    if (onSelectCliente) {
      onSelectCliente(id)
    }
  }

  return (
    <div
      data-testid="clientes-list-panel"
      className="flex h-full flex-col"
    >
      <div className="shrink-0 p-3">
        <input
          type="search"
          role="searchbox"
          aria-label="Buscar clientes"
          placeholder="Buscar por nombre o NIT/RUC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#0e79fd] focus:outline-none focus:ring-1 focus:ring-[#0e79fd] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-3">
            <Skeleton count={3} height={52} className="mb-2" />
          </div>
        )}

        {!isLoading && isError && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && filtered.length === 0 && clientes.length === 0 && (
          <EmptyState message="Aún no tienes clientes. Crea tu primer cliente para comenzar." />
        )}

        {!isLoading && !isError && (filtered.length > 0 || (clientes.length > 0 && filtered.length === 0)) && (
          <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((cliente) => (
              <ClienteListItem
                key={cliente.id}
                cliente={cliente}
                isSelected={selectedId === cliente.id}
                onClick={handleClick}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
