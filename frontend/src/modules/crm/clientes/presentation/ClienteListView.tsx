import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Input } from 'siesa-ui-kit'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import { ClientListItem } from '@/shared/components/ClientListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

import { useClientes } from '../application/useClientes'

const DEBOUNCE_MS = 150
const SKELETON_COUNT = 5

interface ClientesRouteSearch {
  selected?: string
}

/**
 * Story 2.1 — Client list panel (left pane, 280px).
 *
 * Renders five mutually-exclusive states in order:
 *   1. pending  → skeletons
 *   2. error    → ErrorPanel
 *   3. no data  → EmptyState `no-clients`
 *   4. filtered empty → EmptyState `search-empty`
 *   5. success  → list of ClientListItem
 */
export function ClienteListView(): React.ReactElement {
  const { data, status, refetch } = useClientes()
  const navigate = useNavigate()

  // Selection lives in the URL search param so Story 2.2 can lift it into a
  // route segment without breaking this component.
  let selectedId: string | undefined
  try {
    const search = useSearch({ strict: false }) as ClientesRouteSearch
    selectedId = search?.selected
  } catch {
    selectedId = undefined
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filtered = useMemo(() => {
    const list = data ?? []
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nitRuc.toLowerCase().includes(q),
    )
  }, [data, debouncedQuery])

  const handleSelect = (id: string): void => {
    void navigate({ to: '/clientes', search: { selected: id } as never })
  }

  const renderBody = (): React.ReactNode => {
    if (status === 'pending') {
      return (
        <div
          data-testid="client-list-skeleton"
          role="status"
          aria-busy="true"
          aria-label="Cargando clientes"
          className="flex flex-col"
        >
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              data-testid="client-list-skeleton-item"
              className="border-b border-slate-200 px-4 py-3"
            >
              <Skeleton height={16} width="80%" />
              <Skeleton height={12} width="50%" />
            </div>
          ))}
        </div>
      )
    }

    if (status === 'error') {
      return <ErrorPanel onRetry={() => void refetch()} />
    }

    if (data && data.length === 0) {
      return (
        <EmptyState
          variant="no-clients"
          onAction={() => {
            /* Story 2.3 wires the real handler. */
          }}
        />
      )
    }

    if (filtered.length === 0) {
      return <EmptyState variant="search-empty" />
    }

    return (
      <ul
        role="listbox"
        aria-label="Lista de clientes"
        className="flex flex-col"
      >
        {filtered.map((cliente) => (
          <li key={cliente.id}>
            <ClientListItem
              cliente={cliente}
              isSelected={selectedId === cliente.id}
              onSelect={handleSelect}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <aside
      data-testid="client-list-panel"
      className="w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white"
    >
      <div className="sticky top-0 z-10 bg-white p-3">
        <Input
          data-testid="client-search-input"
          placeholder="Buscar por nombre o NIT/RUC"
          aria-label="Buscar clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {renderBody()}
    </aside>
  )
}
