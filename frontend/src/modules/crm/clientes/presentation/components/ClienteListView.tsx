import { useMemo, useState } from 'react'
import { Input, Button, AlertDialog } from 'siesa-ui-kit'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useClientes } from '@/modules/crm/clientes/application/hooks/useClientes'
import { ClientListItem } from '@/shared/components/ClientListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { SortControl, type SortOption } from '@/shared/components/SortControl'
import { ClienteForm } from '@/modules/crm/clientes/presentation/components/ClienteForm'
import type { Cliente } from '@/modules/crm/clientes/domain/entities/Cliente'

const SORT_COMPARATORS: Record<SortOption, (a: Cliente, b: Cliente) => number> = {
  'nombre-asc': (a, b) => a.nombre.localeCompare(b.nombre),
  'nombre-desc': (a, b) => b.nombre.localeCompare(a.nombre),
  'fecha-desc': (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  'fecha-asc': (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
}

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { data, isLoading, isError, refetch } = useClientes()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const clienteId = pathname.match(/^\/clientes\/(.+)$/)?.[1]

  const handleSelect = (cliente: Cliente) => {
    void navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })
  }

  const filteredClientes = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    const term = searchQuery.trim().toLowerCase()
    const matched = term
      ? data.filter(
          (cliente) =>
            cliente.nombre.toLowerCase().includes(term) || cliente.nit.toLowerCase().includes(term),
        )
      : data
    return [...matched].sort(SORT_COMPARATORS[sortOption])
  }, [data, searchQuery, sortOption])

  return (
    <div data-testid="clientes-list-panel" className="panel-list flex h-full flex-col gap-3 p-4">
      {/*
        siesa-ui-kit@1.0.250's `Input` spreads unrecognized props (including
        `startIcon`) directly onto the underlying DOM `<input>`, which makes
        React warn ("does not recognize the `startIcon` prop on a DOM
        element") and violates NFR6 (zero console errors). The icon is
        positioned manually instead of relying on that prop.
      */}
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            data-testid="cliente-search-input"
            placeholder="Buscar cliente por nombre o NIT/RUC"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10"
          />
        </div>
        <SortControl value={sortOption} onChange={setSortOption} />
        <Button
          leftIcon={<PlusIcon className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Nuevo cliente
        </Button>
      </div>

      <AlertDialog
        isOpen={isCreateDialogOpen}
        title="Nuevo cliente"
        onCancel={() => setIsCreateDialogOpen(false)}
        hideCancel
        actions={null}
        description={
          <ClienteForm mode="create" onSuccess={() => setIsCreateDialogOpen(false)} />
        }
      />

      {isLoading && (
        <div data-testid="clientes-list-loading">
          <Skeleton count={5} height={48} className="mb-2" />
        </div>
      )}

      {!isLoading && isError && <ErrorPanel onRetry={() => refetch()} />}

      {!isLoading && !isError && data && data.length === 0 && <EmptyState variant="no-clients" />}

      {!isLoading && !isError && data && data.length > 0 && filteredClientes.length === 0 && (
        <EmptyState variant="search-empty" />
      )}

      {!isLoading && !isError && filteredClientes.length > 0 && (
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {filteredClientes.map((cliente) => (
            <ClientListItem
              key={cliente.id}
              cliente={cliente}
              selected={cliente.id === clienteId}
              onClick={handleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
