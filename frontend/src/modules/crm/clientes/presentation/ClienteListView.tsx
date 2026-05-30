import { useState, useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { filterClientes } from '../application/filterClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data = [], isLoading, isError, refetch } = useClientes()
  const params = useParams({ strict: false }) as { clienteId?: string }
  const activeClienteId = params.clienteId

  const filteredClientes = useMemo(
    () => filterClientes(data, searchQuery),
    [data, searchQuery],
  )

  return (
    <aside
      data-testid="clientes-list-view"
      className="w-[280px] shrink-0 flex flex-col h-full border-r border-slate-200 bg-white"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Clientes</h2>
        <input
          type="search"
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col gap-2 p-3" data-testid="clientes-skeleton">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1 p-3">
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </div>
            ))}
          </div>
        )}

        {isError && <ErrorPanel onRetry={() => refetch()} />}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState
            title="No hay clientes registrados"
            description="Crea el primer cliente para comenzar"
          />
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
