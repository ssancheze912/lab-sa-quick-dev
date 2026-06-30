import { useState, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { PlusIcon } from '@heroicons/react/24/outline'
import { AlertDialog } from 'siesa-ui-kit'
import { useClientes } from '../application/useClientes'
import { ClienteListItem } from '../../../../shared/components/ClienteListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import { ClienteForm } from './ClienteForm'

export function ClienteListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { data = [], isLoading, isError, refetch } = useClientes()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const selectedId = (params as Record<string, string>)['clienteId'] ?? ''

  const filteredClientes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return data
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q),
    )
  }, [data, searchQuery])

  return (
    <div data-testid="clientes-list-panel" className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-slate-200">
      <div className="p-3 flex flex-col gap-2">
        <button
          type="button"
          aria-pressed={isFormOpen}
          onClick={() => setIsFormOpen(true)}
          className="flex w-full items-center justify-center gap-1 rounded-md bg-[#0e79fd] px-3 py-2 text-sm text-white hover:bg-[#154ca9]"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Nuevo cliente
        </button>
        <input
          type="text"
          data-testid="search-clientes"
          placeholder="Buscar por nombre o NIT..."
          aria-label="Buscar clientes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0e79fd] focus:outline-none focus:ring-1 focus:ring-[#0e79fd]"
        />
      </div>

      <AlertDialog
        isOpen={isFormOpen}
        title="Nuevo cliente"
        onCancel={() => setIsFormOpen(false)}
        hideCancel
        actions={null}
        preventCloseOnOverlayClick
        size="max-w-md"
      >
        <ClienteForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => setIsFormOpen(false)}
        />
      </AlertDialog>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-3 py-2" aria-label="Cargando clientes">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mb-2">
                <Skeleton height={16} width="80%" />
                <Skeleton height={12} width="50%" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <ErrorPanel
            message="Error al cargar los clientes."
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && filteredClientes.length === 0 && (
          <EmptyState
            message={
              data.length === 0
                ? 'No hay clientes registrados. Crea el primer cliente.'
                : 'No se encontraron clientes con ese criterio de búsqueda.'
            }
          />
        )}

        {!isLoading && !isError && filteredClientes.length > 0 && (
          <ul role="list" aria-label="Lista de clientes">
            {filteredClientes.map((cliente) => (
              <li key={cliente.id}>
                <ClienteListItem
                  cliente={cliente}
                  isSelected={cliente.id === selectedId}
                  onClick={() =>
                    void navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
