import { useState, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import { ClienteListItem } from '../../../../shared/components/ClienteListItem'

interface ClienteListViewProps {
  selectedClienteId: string | null
  onClienteSelect: (id: string) => void
}

export function ClienteListView({ selectedClienteId, onClienteSelect }: ClienteListViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { data, isLoading, isError, refetch } = useClientes()

  const filteredClientes = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col h-full border-r border-slate-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Clientes</h2>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT..."
          aria-label="Buscar cliente"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
      </div>

      <div role="listbox" aria-label="Lista de clientes" className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4" data-testid="clientes-list-skeleton">
            <Skeleton count={8} height={56} />
          </div>
        )}

        {isError && !isLoading && (
          <ErrorPanel message="Error al cargar los clientes." onRetry={refetch} />
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <EmptyState message="No hay clientes registrados. Crea el primero." />
        )}

        {!isLoading && !isError && data && data.length > 0 && filteredClientes.length === 0 && (
          <p className="p-4 text-sm text-slate-500 text-center">
            Sin resultados para &quot;{searchQuery}&quot;
          </p>
        )}

        {!isLoading && !isError && filteredClientes.length > 0 &&
          filteredClientes.map((cliente) => (
            <ClienteListItem
              key={cliente.id}
              cliente={cliente}
              isSelected={cliente.id === selectedClienteId}
              onClick={() => onClienteSelect(cliente.id)}
            />
          ))
        }
      </div>
    </div>
  )
}
