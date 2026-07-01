import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Input } from 'siesa-ui-kit'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { filterClientes } from '../application/filterClientes'
import { useClientes } from '../application/useClientes'
import { ClienteListItem } from './ClienteListItem'

interface ClienteListViewProps {
  selectedId?: string
  onSelect: (id: string) => void
}

/**
 * Left-panel client list — Story 2.1.
 *
 * Fixed 280px wide, scrollable body, non-scrolling search bar on top.
 * Branches (first truthy wins):
 *   1. pending → skeletons (AC #6)
 *   2. error   → ErrorPanel with Reintentar (AC #5)
 *   3. empty API → EmptyState "no-clients" (AC #3)
 *   4. empty filter → EmptyState "search-empty" (AC #4)
 *   5. list → ClienteListItem[] (AC #1, #2)
 *
 * Search is 100% client-side: `filterClientes` runs over the TanStack Query
 * cache. NO extra network fetch on typing (AC #2). Memoised on `data` +
 * `query` so the perf benchmark (AC #9) stays under 500ms at n=500.
 */
export function ClienteListView({ selectedId, onSelect }: ClienteListViewProps) {
  const { data, isPending, isError, refetch } = useClientes()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => filterClientes(data ?? [], query), [data, query])

  return (
    <div
      data-testid="cliente-list-panel"
      className="flex h-full w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white"
    >
      <div className="border-b border-slate-200 p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          data-testid="cliente-search-input"
          inputSize="sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isPending ? (
          <div data-testid="cliente-list-skeleton" className="space-y-2 p-3">
            <Skeleton height={32} />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={64} />
            ))}
          </div>
        ) : isError ? (
          <ErrorPanel
            onRetry={() => {
              void refetch()
            }}
            testId="cliente-list-error"
            retryTestId="cliente-list-retry"
          />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState variant="no-clients" testId="cliente-list-empty" />
        ) : filtered.length === 0 ? (
          <EmptyState variant="search-empty" testId="cliente-search-empty" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((cliente) => (
              <li key={cliente.id}>
                <ClienteListItem
                  cliente={cliente}
                  selected={cliente.id === selectedId}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
