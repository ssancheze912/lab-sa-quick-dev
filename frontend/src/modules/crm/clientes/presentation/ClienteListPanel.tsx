import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ClienteListPanel() {
  const { data: clientes, isLoading, isError, refetch } = useClientes()
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const selectedClienteId = (params as Record<string, string | undefined>).clienteId

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return clientes ?? []
    const q = searchQuery.toLowerCase()
    return (clientes ?? []).filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q)
    )
  }, [clientes, searchQuery])

  return (
    <div className="w-[280px] shrink-0 flex flex-col bg-white border-r border-slate-200 h-full">
      <div className="px-4 py-3 border-b border-slate-200">
        <label htmlFor="buscar-clientes" className="sr-only">
          Buscar clientes
        </label>
        <input
          id="buscar-clientes"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': '#0e79fd' } as React.CSSProperties}
          aria-label="Buscar clientes"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton height={16} width="70%" />
                <Skeleton height={12} width="40%" className="mt-1" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <ErrorPanel onRetry={() => { void refetch() }} />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState message="No hay clientes. Crea el primero." />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <div>
            {filteredClientes.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                cliente={cliente}
                isSelected={cliente.id === selectedClienteId}
                onClick={() => {
                  void navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
