import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Input } from 'siesa-ui-kit'
import { useNavigate, useMatchRoute } from '@tanstack/react-router'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { useClientes } from '../application/useClientes'
import { ClientListItem } from './ClientListItem'

/**
 * 280px left-hand panel showing the full clientes list with a client-side
 * search filter. Rendering priority (top-down):
 *   1. Loading    → skeleton  + disabled input
 *   2. Error      → ErrorPanel with Reintentar (refetches useClientes)
 *   3. Zero data  → EmptyState variant "no-clients" + disabled input + CTA
 *   4. Zero match → EmptyState variant "search-empty" (input keeps its value)
 *   5. Otherwise  → scrollable list with one ClientListItem per cliente
 *
 * Selection state is driven by the current route params — clicking an item
 * navigates to /clientes/$clienteId; the matching id becomes `isSelected`.
 * On mobile (< lg) the list hides when a cliente is active so the detail
 * panel gets the full viewport (master-detail responsive pattern).
 */
export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const detailMatch = matchRoute({ to: '/clientes/$clienteId' }) as
    | { clienteId?: string }
    | false
  const activeClienteId = detailMatch ? detailMatch.clienteId : undefined

  const {
    data: clientes = [],
    isLoading,
    isError,
    refetch,
  } = useClientes()

  const filteredClientes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return clientes
    }
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q),
    )
  }, [clientes, searchQuery])

  const noClients = !isLoading && !isError && clientes.length === 0
  const noMatches = !isLoading && !isError && !noClients && filteredClientes.length === 0

  const inputDisabled = isLoading || isError || noClients

  const asideClasses = `${
    activeClienteId ? 'hidden lg:flex' : 'flex'
  } h-full w-full flex-col border-r border-slate-200 lg:w-[280px] lg:shrink-0`

  return (
    <aside
      data-testid="clientes-list-panel"
      className={asideClasses}
    >
      <div className="border-b border-slate-200 p-4">
        <h1
          id="clientes-title"
          className="text-lg font-bold text-slate-900"
        >
          Clientes
        </h1>
      </div>

      <div className="border-b border-slate-200 p-3">
        <Input
          type="text"
          aria-label="Buscar clientes"
          placeholder="Buscar por nombre o NIT..."
          value={searchQuery}
          disabled={inputDisabled}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="clientes-search-input"
        />
      </div>

      {isLoading ? (
        <div
          data-testid="clientes-list-skeleton"
          aria-busy="true"
          className="flex flex-col gap-1 p-3"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              height={56}
              containerTestId={`clientes-list-skeleton-item-${i}`}
            />
          ))}
        </div>
      ) : isError ? (
        <ErrorPanel
          onRetry={() => {
            void refetch()
          }}
          testId="clientes-error-panel"
        />
      ) : noClients ? (
        <EmptyState
          variant="no-clients"
          title="No hay clientes registrados"
          subtitle="Crea el primer cliente del sistema"
          cta={{
            label: 'Nuevo cliente',
            onClick: () => {
              // Story 2.3 wires the real create flow; for now this is a no-op.
              console.info('TODO: Story 2.3 — Create Client')
            },
          }}
        />
      ) : noMatches ? (
        <EmptyState
          variant="search-empty"
          title="No se encontró ningún cliente"
          subtitle="Intenta con otro nombre o NIT"
        />
      ) : (
        <ul
          role="list"
          data-testid="clientes-list"
          className="flex-1 overflow-y-auto"
        >
          {filteredClientes.map((cliente) => (
            <li key={cliente.id}>
              <ClientListItem
                cliente={cliente}
                isSelected={activeClienteId === cliente.id}
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
    </aside>
  )
}
