import { useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Button, Input } from 'siesa-ui-kit'
import { ClienteListItem } from '@/shared/components/ClienteListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { useClientes } from '../application/useClientes'
import { useDebouncedValue } from '../application/useDebouncedValue'
import { ClienteFormDialog } from './ClienteFormDialog'

/**
 * Case- and accent-insensitive lowercase transform used by the client-side
 * filter. NFD decomposition splits base + combining diacritics; the regex
 * strips the combining marks (U+0300..U+036F) so "Peña" matches "pena".
 * Uses explicit \u escapes (safer than literal combining characters across
 * editors / transformers).
 */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036F]/g, '').toLowerCase()
}

/**
 * Left panel of the /clientes route (Story 2.1).
 *
 * Responsibilities:
 *  - fetch the list once via `useClientes` (TanStack Query cache, key ['clientes'])
 *  - render the header (search input + disabled "Nuevo cliente" placeholder)
 *  - filter the list client-side using a 150 ms debounced search value
 *  - render loading skeletons, error panel, empty-states and the item list
 *  - update the URL on selection via `router.navigate`
 */
export function ClienteListView() {
  const { data, isLoading, isError, isFetching, refetch } = useClientes()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search, 150)
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { clienteId?: string }
  const selectedId = params.clienteId ?? null

  const filtered = useMemo(() => {
    const list = data ?? []
    // Trim first so whitespace-only queries are treated as "empty" — otherwise
    // typing spaces would filter every client out and misfire the search-empty
    // state (see ClienteListView.edge.test.tsx "no-op search").
    const trimmed = debouncedSearch.trim()
    if (!trimmed) return list
    const q = norm(trimmed)
    return list.filter(
      (c) => norm(c.nombre).includes(q) || norm(c.nit).includes(q),
    )
  }, [data, debouncedSearch])

  return (
    <aside
      role="complementary"
      aria-label="Lista de clientes"
      className="w-[280px] flex-shrink-0 border-r border-slate-200 flex flex-col h-full overflow-hidden"
    >
      <header className="p-3 border-b border-slate-200 space-y-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o NIT..."
          aria-label="Buscar clientes"
        />
        <Button
          type="default"
          color="primary"
          fullWidth
          onClick={() => setDialogOpen(true)}
        >
          Nuevo cliente
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <ul className="p-3 space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} data-testid="cliente-skeleton">
                <Skeleton height={44} />
              </li>
            ))}
          </ul>
        )}

        {!isLoading && isError && (
          <ErrorPanel
            title="No se pudo cargar la lista de clientes"
            subtitle="Comprueba tu conexión e intenta nuevamente."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        )}

        {!isLoading && !isError && filtered.length === 0 && debouncedSearch.trim() === '' && (
          <EmptyState variant="no-clients" />
        )}

        {!isLoading && !isError && filtered.length === 0 && debouncedSearch.trim() !== '' && (
          <EmptyState variant="search-empty" />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <ul role="list" className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <li key={c.id}>
                <ClienteListItem
                  cliente={c}
                  selected={c.id === selectedId}
                  onSelect={(id) =>
                    void navigate({
                      to: '/clientes/$clienteId',
                      params: { clienteId: id },
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ClienteFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </aside>
  )
}
