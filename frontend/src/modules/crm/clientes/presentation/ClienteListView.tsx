import { useState, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Input } from 'siesa-ui-kit'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import { NuevoClienteDialog } from './NuevoClienteDialog'

interface ClienteListViewProps {
  selectedClienteId?: string | null
  onSelectCliente?: (clienteId: string) => void
}

export function ClienteListView({
  selectedClienteId,
  onSelectCliente,
}: ClienteListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: clientes, isLoading, isError, refetch } = useClientes()

  const filteredClientes = useMemo(() => {
    if (!clientes) return []
    if (!searchQuery.trim()) return clientes
    const q = searchQuery.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q),
    )
  }, [clientes, searchQuery])

  return (
    <div
      className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-slate-200 bg-white"
      data-testid="cliente-list-panel"
    >
      <div className="flex items-center gap-2 p-3">
        <Input
          aria-label="Buscar clientes"
          placeholder="Buscar por nombre o NIT/RUC"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="cliente-search-input"
          className="flex-1"
        />
        <button
          data-testid="nuevo-cliente-btn"
          onClick={() => setIsDialogOpen(true)}
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-[#0e79fd] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#154ca9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] whitespace-nowrap"
        >
          Nuevo cliente
        </button>
      </div>

      <NuevoClienteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      <div className="flex-1 overflow-y-auto px-2 pb-2" data-testid="cliente-list">
        {isLoading && (
          <div data-testid="cliente-loading-skeleton">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={60} className="mb-2" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorPanel onRetry={refetch} />
        )}

        {!isLoading && !isError && clientes !== undefined && clientes.length === 0 && (
          <EmptyState message="Aún no hay clientes. Crea el primero." />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 &&
          filteredClientes.map((cliente) => (
            <ClientListItem
              key={cliente.id}
              cliente={cliente}
              isSelected={selectedClienteId === cliente.id}
              onClick={() => onSelectCliente?.(cliente.id)}
            />
          ))
        }
      </div>
    </div>
  )
}
