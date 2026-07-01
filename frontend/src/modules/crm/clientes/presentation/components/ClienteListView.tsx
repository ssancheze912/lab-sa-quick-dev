import { useMemo, useState } from 'react'
import { Input } from 'siesa-ui-kit'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useClientes } from '@/modules/crm/clientes/application/hooks/useClientes'
import { ClientListItem } from '@/shared/components/ClientListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import type { Cliente } from '@/modules/crm/clientes/domain/entities/Cliente'

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, isError, refetch } = useClientes()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const clienteId = pathname.match(/^\/clientes\/(.+)$/)?.[1]

  const handleSelect = (cliente: Cliente) => {
    void navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })
  }

  const filteredClientes = useMemo(() => {
    if (!data) return []
    const term = searchQuery.trim().toLowerCase()
    if (!term) return data
    return data.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(term) || cliente.nit.toLowerCase().includes(term),
    )
  }, [data, searchQuery])

  return (
    <div data-testid="clientes-list-panel" className="panel-list flex h-full flex-col gap-3 p-4">
      <Input
        data-testid="cliente-search-input"
        placeholder="Buscar cliente por nombre o NIT/RUC"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        startIcon={<MagnifyingGlassIcon />}
      />

      {isLoading && (
        <div data-testid="clientes-list-loading">
          <Skeleton count={5} height={48} className="mb-2" />
        </div>
      )}

      {!isLoading && isError && <ErrorPanel onRetry={() => refetch()} />}

      {!isLoading && !isError && data && data.length === 0 && <EmptyState variant="no-clients" />}

      {!isLoading && !isError && data && data.length > 0 && filteredClientes.length === 0 && (
        <EmptyState variant="search-empty" />
      )}

      {!isLoading && !isError && filteredClientes.length > 0 && (
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {filteredClientes.map((cliente) => (
            <ClientListItem
              key={cliente.id}
              cliente={cliente}
              selected={cliente.id === clienteId}
              onClick={handleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
