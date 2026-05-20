import { useState, useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ClienteListPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data = [], isLoading, isError, refetch } = useClientes()
  const params = useParams({ strict: false }) as { clienteId?: string }
  const activeClienteId = params.clienteId

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return data
    const lower = searchQuery.toLowerCase()
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(lower) ||
        c.nit.toLowerCase().includes(lower),
    )
  }, [data, searchQuery])

  return (
    <aside
      data-testid="clientes-list-panel"
      className="w-[280px] shrink-0 flex flex-col h-full border-r border-slate-200 bg-white"
    >
      {/* Search input */}
      <div className="px-3 py-3 border-b border-slate-100">
        <input
          type="search"
          placeholder="Buscar cliente por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1 p-3">
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <ErrorPanel onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul role="list" aria-label="Lista de clientes" className="flex flex-col gap-0.5 p-2">
            {filteredClientes.map((cliente) => (
              <li key={cliente.id}>
                <Link
                  to="/clientes/$clienteId"
                  params={{ clienteId: cliente.id }}
                  style={{ textDecoration: 'none' }}
                >
                  <ClientListItem
                    nombre={cliente.nombre}
                    nit={cliente.nit}
                    isActive={cliente.id === activeClienteId}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
