import { useMemo, useState } from 'react'
import { Input } from 'siesa-ui-kit'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useContactos } from '@/modules/crm/contactos/application/hooks/useContactos'
import { ContactListItem } from '@/shared/components/ContactListItem'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

export function ContactoListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, isError, refetch } = useContactos()

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
      </div>

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
            <ContactListItem key={contacto.id} contacto={contacto} />
          ))}
        </ul>
      )}
    </div>
  )
}
