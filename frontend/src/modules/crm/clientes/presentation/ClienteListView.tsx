import { useState, useMemo, memo, useTransition } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import type { Cliente } from '../domain/Cliente'

type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

interface ClienteListProps {
  sorted: Cliente[]
  selectedClienteId?: string
  onClienteSelect: (id: string) => void
}

const ClienteList = memo(function ClienteList({ sorted, selectedClienteId, onClienteSelect }: ClienteListProps) {
  return (
    <ul data-testid="cliente-list" aria-label="Lista de clientes">
      {sorted.map((cliente) => (
        <li key={cliente.id}>
          <ClientListItem
            cliente={cliente}
            isSelected={cliente.id === selectedClienteId}
            onClick={() => onClienteSelect(cliente.id)}
          />
        </li>
      ))}
    </ul>
  )
})

interface ClienteListViewProps {
  selectedClienteId?: string
  onClienteSelect: (id: string) => void
}

export function ClienteListView({ selectedClienteId, onClienteSelect }: ClienteListViewProps) {
  const { data: clientes, isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')
  const [deferredQuery, setDeferredQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')
  const [, startTransition] = useTransition()

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    startTransition(() => {
      setDeferredQuery(value)
    })
  }

  // Pre-compute lowercase values once per data change (not per keystroke)
  const clientesLower = useMemo(() => {
    if (!clientes) return []
    return clientes.map((c) => ({
      ...c,
      _nombreLower: c.nombre.toLowerCase(),
      _nitLower: c.nit.toLowerCase(),
    }))
  }, [clientes])

  const filtered = useMemo(() => {
    if (!clientesLower.length) return []
    const q = deferredQuery.toLowerCase()
    if (!q) return clientesLower
    return clientesLower.filter(
      (c) => c._nombreLower.includes(q) || c._nitLower.includes(q),
    )
  }, [clientesLower, deferredQuery])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre)
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre)
        case 'fecha-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'fecha-desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  }, [filtered, sortOption])

  return (
    <div className="w-[280px] h-full flex flex-col border-r border-slate-200">
      {/* Search input */}
      <div className="px-3 py-2 border-b border-slate-200">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Sort control */}
      <div className="px-3 py-2 border-b border-slate-100">
        <select
          data-testid="sort-control"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="w-full text-xs border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Ordenar por"
        >
          <option value="fecha-desc">Más reciente</option>
          <option value="fecha-asc">Más antiguo</option>
          <option value="nombre-asc">Nombre A-Z</option>
          <option value="nombre-desc">Nombre Z-A</option>
        </select>
      </div>

      {/* Content area */}
      <div className="overflow-y-auto flex-1">
        {isLoading && (
          <div data-testid="cliente-list-skeleton">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-slate-100">
                <Skeleton height={16} width="70%" />
                <Skeleton height={12} width="40%" className="mt-1" />
              </div>
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <EmptyState
            title="Sin clientes"
            description="Aún no hay clientes registrados. Crea el primero."
          />
        )}

        {!isLoading && !isError && sorted.length > 0 && (
          <ClienteList
            sorted={sorted}
            selectedClienteId={selectedClienteId}
            onClienteSelect={onClienteSelect}
          />
        )}
      </div>
    </div>
  )
}
