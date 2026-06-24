import { useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from '../../../../shared/components/ClientListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, isError, refetch } = useClientes()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const selectedClienteId = (params as { clienteId?: string }).clienteId

  const filteredClientes = useMemo(() => {
    if (!data) return []
    const q = searchQuery.toLowerCase().trim()
    if (!q) return data
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    )
  }, [data, searchQuery])

  return (
    <aside
      aria-label="Lista de clientes"
      data-testid="cliente-list-view"
      className="w-[280px] border-r border-slate-200 flex flex-col h-full"
    >
      <div className="p-3 border-b border-slate-200">
        <input
          type="text"
          placeholder="Buscar por nombre o NIT/RUC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="client-search-input"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-3 space-y-2">
            <Skeleton height={48} count={5} />
          </div>
        )}

        {isError && <ErrorPanel onRetry={() => void refetch()} />}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState
            message={
              searchQuery.trim()
                ? 'No se encontraron clientes que coincidan con la búsqueda.'
                : 'No hay clientes registrados. Crea el primero.'
            }
          />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul role="listbox" aria-label="Lista de clientes">
            {filteredClientes.map((cliente) => (
              <ClientListItem
                key={cliente.id}
                cliente={cliente}
                isSelected={selectedClienteId === cliente.id}
                onClick={(id) =>
                  void navigate({
                    to: '/clientes/$clienteId',
                    params: { clienteId: id },
                  })
                }
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
