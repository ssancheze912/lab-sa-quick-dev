import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Input } from 'siesa-ui-kit'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import { ClientListItem } from '@/shared/components/ClientListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

import { useClientes } from '../application/useClientes'

const DEBOUNCE_MS = 150
const SKELETON_COUNT = 5

/**
 * Story 2.1 + 2.2 — Client list panel (left pane, 280px).
 *
 * Selection comes from the `$clienteId` route segment (Story 2.2). Mounted by
 * `ClientesShell` so it lives in both `/clientes` and `/clientes/$clienteId`
 * without remounting between them.
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

  // `strict: false` lets the same component mount on `/clientes` (no id) and
  // on `/clientes/$clienteId` (id present). Wrapped in try/catch so it stays
  // testable outside of a RouterProvider (component-level tests render this
  // view directly).
  let selectedId: string | undefined
  try {
    const params = useParams({ strict: false }) as { clienteId?: string }
    selectedId = params?.clienteId
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
    void navigate({
      to: '/clientes/$clienteId',
      params: { clienteId: id },
    })
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
