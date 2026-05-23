import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '@/shared/components/ClientListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: clientes, isLoading, isError, refetch } = useClientes()

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return clientes ?? []
    const q = searchQuery.toLowerCase()
    return (clientes ?? []).filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
    )
  }, [clientes, searchQuery])

  return (
    <div
      data-testid="clientes-list-panel"
      className="w-[280px] flex flex-col h-full border-r border-slate-200"
    >
      <div className="px-3 py-2">
        <input
          type="search"
          role="searchbox"
          placeholder="Buscar cliente..."
          aria-label="Buscar cliente"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        />
      </div>

      {isLoading && (
        <ul className="flex-1 overflow-y-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="px-3 py-2">
              <Skeleton height={40} />
            </li>
          ))}
        </ul>
      )}

      {isError && (
        <ErrorPanel onRetry={() => refetch()} aria-label="Error al cargar clientes" />
      )}

      {!isLoading && !isError && clientes !== undefined && clientes.length === 0 && (
        <EmptyState
          message="No hay clientes aún. Crea el primero."
          aria-label="Lista vacía de clientes"
        />
      )}

      {!isLoading && !isError && clientes !== undefined && clientes.length > 0 && (
        <>
          {filteredClientes.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              No se encontró ningún cliente para «{searchQuery}»
            </p>
          ) : (
            <ul className="flex-1 overflow-y-auto" role="list">
              {filteredClientes.map((cliente) => (
                <ClientListItem
                  key={cliente.id}
                  id={cliente.id}
                  nombre={cliente.nombre}
                  nit={cliente.nit}
                  onClick={() => {}}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
