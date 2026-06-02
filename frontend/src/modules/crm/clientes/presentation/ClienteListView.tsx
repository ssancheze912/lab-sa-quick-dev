import { useEffect, useMemo, useState } from 'react'
import { UsersIcon } from '@heroicons/react/24/outline'
import { Input } from 'siesa-ui-kit'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { ClientListItem } from '@/shared/components/ClientListItem'

import { useClientes } from '../application/useClientes'
import { filterClientes } from '../application/filterClientes'

export interface ClienteListViewProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedClienteId: string | null
  onSelectCliente: (id: string) => void
}

/**
 * Split-panel left list for `/clientes` (Story 2.1).
 *
 * Renders one of four states depending on the TanStack Query result:
 *   - loading  → Skeleton placeholders (3 items)
 *   - error    → <ErrorPanel onRetry={refetch} /> (NFR6 — never leaks payload)
 *   - empty    → <EmptyState ... /> (Spanish copy + "Nuevo cliente" CTA)
 *   - list     → filtered scrollable list of <ClientListItem />
 *
 * Search is 100% client-side per architecture line 233; no debounce because
 * `filterClientes` over 500 records < 5 ms (NFR1).
 */
export function ClienteListView({
  searchQuery,
  onSearchChange,
  selectedClienteId,
  onSelectCliente,
}: ClienteListViewProps) {
  const { data, isLoading, isError, refetch, isFetching } = useClientes()

  // Local input state — keeps typing snappy and decouples the input from
  // the parent's render cycle. The parent prop `searchQuery` seeds it (so
  // URL-driven hydration can drop in later) and `onSearchChange` mirrors
  // each keystroke outward.
  const [internalQuery, setInternalQuery] = useState(searchQuery)
  useEffect(() => {
    setInternalQuery(searchQuery)
  }, [searchQuery])

  const filtered = useMemo(
    () => filterClientes(data ?? [], internalQuery),
    [data, internalQuery],
  )

  return (
    <aside
      aria-label="Lista de clientes"
      className="w-full lg:w-[280px] flex-shrink-0 h-full overflow-y-auto border-r border-slate-200 bg-slate-50"
    >
      <div className="flex flex-col gap-3 p-4">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <Input
          type="search"
          value={internalQuery}
          onChange={(e) => {
            setInternalQuery(e.target.value)
            onSearchChange(e.target.value)
          }}
          placeholder="Buscar cliente por nombre o NIT/RUC..."
          aria-label="Buscar cliente"
          data-testid="cliente-search-input"
        />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2 px-4" aria-hidden="true">
          <Skeleton height={56} count={3} />
        </div>
      )}

      {isError && (
        <ErrorPanel
          onRetry={() => {
            void refetch()
          }}
          isRetrying={isFetching}
        />
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState
          icon={<UsersIcon className="h-6 w-6" aria-hidden="true" />}
          title="Aún no hay clientes"
          description="Crea el primer cliente para empezar."
          ctaLabel="Nuevo cliente"
          onCtaClick={() => {}}
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <ul role="list" className="flex flex-col">
          {filtered.map((cliente) => (
            <li key={cliente.id}>
              <ClientListItem
                cliente={cliente}
                isSelected={cliente.id === selectedClienteId}
                onClick={() => onSelectCliente(cliente.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
