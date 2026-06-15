import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../application/useClientes'
import { ClienteForm } from './ClienteForm'
import { ClientListItem } from '@/shared/components/ClientListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

const normalize = (s: string) => s.toLowerCase().trim()

interface ClienteListViewProps {
  /**
   * UUID of the currently routed cliente — used to mark the active item
   * via `data-active="true"`. Passed by the `clientes.$clienteId.tsx` route;
   * the bare `/clientes` route passes nothing.
   */
  selectedClienteId?: string
}

/**
 * Left panel of the `/clientes` split-panel layout. 280px wide, scrollable
 * in the y axis. Renders one of: skeleton loaders, error panel, empty state,
 * search-empty state, or the filtered list of `ClientListItem`s.
 *
 * Story 2.2 adds:
 *   - `selectedClienteId` prop → drives the active-item indicator.
 *   - click handler navigates to `/clientes/$clienteId`.
 */
export function ClienteListView({ selectedClienteId }: ClienteListViewProps = {}) {
  const { data, isLoading, isError, refetch } = useClientes()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 150ms debounce — keeps rapid keystrokes from triggering a re-render storm
  // on the 500-record performance test (AC #11.6 / NFR1).
  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchInput)
    }, 150)
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchInput])

  const clientes = data ?? []

  const filtered = useMemo(() => {
    const q = normalize(debouncedQuery)
    if (!q) return clientes
    return clientes.filter(
      (c) => normalize(c.nombre).includes(q) || normalize(c.nit).includes(q),
    )
  }, [clientes, debouncedQuery])

  const hasClientes = clientes.length > 0
  const hasSearch = debouncedQuery.trim().length > 0
  const noResults = hasClientes && hasSearch && filtered.length === 0

  return (
    <aside
      data-testid="clientes-list-panel"
      className="w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 flex flex-col"
    >
      <h2 className="sr-only">Lista de clientes</h2>

      <div className="border-b border-slate-200 p-3 flex flex-col gap-3">
        <button
          type="button"
          data-testid="btn-nuevo-cliente"
          onClick={() => setIsFormOpen(true)}
          className="w-full rounded-md bg-[#0e79fd] px-3 py-2 text-sm font-semibold text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40"
        >
          Nuevo cliente
        </button>
        <input
          type="text"
          data-testid="clientes-search-input"
          placeholder="Buscar cliente por nombre o NIT/RUC"
          aria-label="Buscar cliente"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          disabled={isError}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40 disabled:bg-slate-100 disabled:text-slate-400"
        />
      </div>

      <ClienteForm open={isFormOpen} onOpenChange={setIsFormOpen} />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <Skeleton height={18} />
                <Skeleton height={14} width="60%" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorPanel
            title="No se pudieron cargar los clientes"
            description="Intenta de nuevo en unos segundos."
            onRetry={() => refetch()}
            testId="clientes-error-panel"
          />
        ) : !hasClientes ? (
          <EmptyState
            variant="no-clients"
            title="Aún no hay clientes"
            description="Crea el primer cliente para empezar a gestionar tu cartera."
            testId="clientes-empty-state"
          />
        ) : noResults ? (
          <EmptyState
            variant="search-empty"
            title="Sin resultados"
            description={`No encontramos clientes con «${debouncedQuery}».`}
            testId="clientes-search-empty"
          />
        ) : (
          <ul className="flex flex-col">
            {filtered.map((c) => (
              <li key={c.id}>
                <ClientListItem
                  cliente={c}
                  isSelected={c.id === selectedClienteId}
                  onClick={(id) =>
                    router.navigate({
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
    </aside>
  )
}
