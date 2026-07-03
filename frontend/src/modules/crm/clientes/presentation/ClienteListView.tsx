import { useDeferredValue, useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import { useClientes } from '../application/useClientes'
import type { Cliente } from '../domain/Cliente'
import { ClientListItem } from '@/shared/components/ClientListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

/**
 * Master list panel for the CRM Clientes view (Story 2.1). 280 px fixed-width
 * column on desktop. Search is 100 % client-side (no additional API calls per
 * keystroke) with React 18's `useDeferredValue` acting as the ~150 ms debounce.
 * Matching is case + accent-insensitive over `nombre` and `nitRuc`.
 *
 * Uses a native `<input>` (rather than `siesa-ui-kit`'s `Input`) because that
 * primitive does not forward arbitrary props (e.g. `data-testid`) to the
 * underlying element. The company-standards fallback rule permits a native
 * element when the primitive cannot honour the required contract.
 */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function ClienteListView() {
  const { data, isLoading, isError, refetch } = useClientes()
  const [rawQuery, setRawQuery] = useState<string>('')
  const query = useDeferredValue(rawQuery)

  const filtered = useMemo<Cliente[]>(() => {
    if (!data) return []
    const q = normalize(query.trim())
    if (q.length === 0) return data
    return data.filter((c) => {
      const nombre = normalize(c.nombre)
      const nitRuc = normalize(c.nitRuc)
      return nombre.includes(q) || nitRuc.includes(q)
    })
  }, [data, query])

  return (
    <aside
      data-testid="cliente-list-panel"
      className="hidden lg:flex w-[280px] flex-shrink-0 flex-col border-r border-slate-200 h-full"
    >
      <div className="p-3 border-b border-slate-200">
        <input
          type="text"
          value={rawQuery}
          onChange={(event) => setRawQuery(event.target.value)}
          placeholder="Buscar cliente…"
          aria-label="Buscar cliente por nombre o NIT/RUC"
          data-testid="cliente-list-search"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-primary,#0e79fd]"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div data-testid="cliente-list-skeleton" className="p-3">
            <Skeleton count={6} height={48} />
          </div>
        ) : isError ? (
          <ErrorPanel onRetry={() => void refetch()} />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            title="Aún no hay clientes"
            description="Cuando registres el primero aparecerá aquí."
          />
        ) : (
          <ul data-testid="cliente-list" className="divide-y divide-slate-100">
            {filtered.map((cliente) => (
              <ClientListItem key={cliente.id} cliente={cliente} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
