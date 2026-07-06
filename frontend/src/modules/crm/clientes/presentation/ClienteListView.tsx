import { useMemo, useState } from 'react'
import { Input } from 'siesa-ui-kit'
import { useClientes } from '@/modules/crm/clientes/application/useClientes'
import { ClientListItem } from '@/shared/components/ClientListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

export function ClienteListView() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: clientes = [], isError, isSuccess, refetch } = useClientes()

  const filteredClientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return clientes
    return clientes.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(term) || cliente.nit.toLowerCase().includes(term),
    )
  }, [clientes, searchTerm])

  return (
    <div data-testid="clientes-list-panel" className="flex h-full w-[280px] flex-col border-r border-slate-200">
      <div role="search" className="p-3">
        <Input
          placeholder="Buscar cliente..."
          aria-label="Buscar clientes"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isError && <ErrorPanel message="No se pudo cargar" onRetry={() => refetch()} />}

        {!isError && isSuccess && filteredClientes.length === 0 && searchTerm === '' && (
          <EmptyState
            title="No hay clientes registrados"
            subtitle="Crea el primer cliente del sistema"
          />
        )}

        {!isError &&
          filteredClientes.map((cliente) => <ClientListItem key={cliente.id} cliente={cliente} />)}
      </div>
    </div>
  )
}
