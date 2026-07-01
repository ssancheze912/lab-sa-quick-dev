import { useMemo, useState } from 'react'
import { Input, Button, AlertDialog } from 'siesa-ui-kit'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useContactos } from '@/modules/crm/contactos/application/hooks/useContactos'
import { ContactListItem } from '@/shared/components/ContactListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { ContactoForm } from '@/modules/crm/contactos/presentation/components/ContactoForm'
import type { Contacto } from '@/modules/crm/contactos/domain/entities/Contacto'

export function ContactoListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { data, isLoading, isError, refetch } = useContactos()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  // Scoped specifically to a single dynamic `$contactoId` segment directly
  // under `/contactos/` — NOT the loose `pathname.match(/^\/contactos\/(.+)$/)`
  // regex Epic 2 review flagged (finding #7) as a future-sibling-route hazard
  // (e.g. a static `/contactos/nuevo` entry point from Story 3.3 would
  // wrongly match a greedy `(.+)` pattern). Excluding `/` from the captured
  // segment ensures only an actual `$contactoId` leaf matches, never a
  // multi-segment static route.
  const contactoId = pathname.match(/^\/contactos\/([^/]+)$/)?.[1]

  const handleSelect = (contacto: Contacto) => {
    void navigate({ to: '/contactos/$contactoId', params: { contactoId: contacto.id } })
  }

  const filteredContactos = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    const term = searchQuery.trim().toLowerCase()
    if (!term) return data
    return data.filter(
      (contacto) =>
        contacto.nombre.toLowerCase().includes(term) || contacto.email.toLowerCase().includes(term),
    )
  }, [data, searchQuery])

  return (
    <div data-testid="contactos-list-panel" className="panel-list flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            data-testid="contacto-search-input"
            placeholder="Buscar contacto por nombre o email"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          leftIcon={<PlusIcon className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Nuevo contacto
        </Button>
      </div>

      <AlertDialog
        isOpen={isCreateDialogOpen}
        title="Nuevo contacto"
        onCancel={() => setIsCreateDialogOpen(false)}
        hideCancel
        actions={null}
        description={
          <ContactoForm mode="create" onSuccess={() => setIsCreateDialogOpen(false)} />
        }
      />

      {isLoading && (
        <div data-testid="contactos-list-loading">
          <Skeleton count={5} height={48} className="mb-2" />
        </div>
      )}

      {!isLoading && isError && <ErrorPanel onRetry={() => refetch()} />}

      {!isLoading && !isError && data && data.length === 0 && <EmptyState variant="no-contacts" />}

      {!isLoading && !isError && data && data.length > 0 && filteredContactos.length === 0 && (
        <EmptyState variant="search-empty" />
      )}

      {!isLoading && !isError && filteredContactos.length > 0 && (
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {filteredContactos.map((contacto) => (
            <ContactListItem
              key={contacto.id}
              contacto={contacto}
              selected={contacto.id === contactoId}
              onClick={handleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
