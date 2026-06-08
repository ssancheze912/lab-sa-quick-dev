import { useMemo, useState } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Input } from 'siesa-ui-kit'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { ClientListItem } from '@/shared/components/ClientListItem'
import { useClientes } from '../application/useClientes'
import { matchesQuery } from '../application/matchesQuery'

/**
 * Story 2.1 — Task 15
 *
 * 280px scrollable left panel that displays every client returned by
 * `GET /api/v1/clientes` and lets the user filter them in real time by
 * `nombre` or `nit` (debounced 150 ms, client-side, no extra HTTP).
 *
 * Mounted on BOTH `/clientes` and `/clientes/$clienteId` so it stays visible
 * during selection — TanStack Router preserves the component instance across
 * the dynamic param change.
 *
 * The Story 1.2 `data-testid="clientes-view"` contract is preserved on the
 * root `<aside>` so the foundation E2E suite keeps passing.
 */
export function ClienteListView() {
  const { data, isLoading, isError, refetch } = useClientes()
  const router = useRouter()
  const { clienteId } = useParams({ strict: false }) as { clienteId?: string }

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 150)

  const filtered = useMemo(
    () => (data ?? []).filter((c) => matchesQuery(c, debouncedQuery)),
    [data, debouncedQuery],
  )

  const hasData = (data?.length ?? 0) > 0

  const handleSelect = (id: string) => {
    // Note: we resolve the template into an absolute path before navigating so
    // the test harness (vitest.setup.ts) — which forwards `opts.to` directly
    // to `history.push` without interpolating params — lands on the right
    // URL. In production the router still understands the absolute path.
    void router.navigate({ to: `/clientes/${id}` })
  }

  return (
    <aside
      data-testid="cliente-list-view"
      className="w-[280px] shrink-0 border-r border-slate-200 h-full flex flex-col"
    >
      {/* Preserve Story 1.2 data-testid contract */}
      <span data-testid="clientes-view" className="sr-only" />

      {hasData ? (
        <header className="p-3 border-b border-slate-200">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o NIT..."
            aria-label="Buscar clientes"
            startIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
          />
        </header>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        {isError ? (
          <ErrorPanel onRetry={() => void refetch()} />
        ) : isLoading ? (
          <ListSkeleton />
        ) : !hasData ? (
          <EmptyState variant="no-clients" />
        ) : filtered.length === 0 ? (
          <EmptyState variant="search-empty" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((cliente) => (
              <li key={cliente.id}>
                <ClientListItem
                  cliente={cliente}
                  isActive={cliente.id === clienteId}
                  onClick={() => handleSelect(cliente.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-slate-100" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="px-3 py-3">
          <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
          <div className="mt-2 h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
        </li>
      ))}
    </ul>
  )
}
