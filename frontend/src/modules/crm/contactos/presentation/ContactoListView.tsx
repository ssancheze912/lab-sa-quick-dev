import { useState, useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useContactos } from '../application/useContactos'
import { filterContactos } from '../application/filterContactos'
import { ContactoListItem } from './ContactoListItem'
import { ContactoFormDialog } from './ContactoFormDialog'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ContactoListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data = [], isLoading, isError, refetch } = useContactos()
  const params = useParams({ strict: false }) as { contactoId?: string }
  const activeContactoId = params.contactoId

  const filteredContactos = useMemo(
    () => filterContactos(data, searchQuery),
    [data, searchQuery],
  )

  return (
    <div
      data-testid="contactos-list-view"
      className="flex flex-col h-full bg-white"
    >
      {/* Search input + Nuevo contacto button */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100 flex flex-col gap-2">
        <button
          type="button"
          data-testid="btn-nuevo-contacto"
          onClick={() => setIsDialogOpen(true)}
          className="w-full px-4 py-2 text-sm rounded-md bg-[#0e79fd] text-white hover:bg-[#154ca9] font-medium"
        >
          Nuevo contacto
        </button>
        <input
          type="search"
          placeholder="Buscar contacto por nombre o email"
          aria-label="Buscar contactos"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent"
        />
      </div>

      <ContactoFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1 p-3">
                <Skeleton width="55%" height={16} />
                <Skeleton width="40%" height={12} />
                <Skeleton width="60%" height={12} />
              </div>
            ))}
          </div>
        )}

        {isError && <ErrorPanel onRetry={() => refetch()} />}

        {!isLoading && !isError && data.length === 0 && (
          <EmptyState
            title="No hay contactos registrados"
            description="Crea el primer contacto para comenzar."
          />
        )}

        {!isLoading && !isError && data.length > 0 && filteredContactos.length === 0 && (
          <EmptyState
            title="Sin resultados"
            description="No hay contactos que coincidan con la búsqueda."
          />
        )}

        {!isLoading && !isError && data.length > 0 && filteredContactos.length > 0 && (
          <ul
            role="list"
            aria-label="Lista de contactos"
            className="flex flex-col gap-0.5 p-2"
          >
            {filteredContactos.map((contacto) => (
              <li key={contacto.id} data-testid="contacto-row">
                <Link
                  to="/contactos/$contactoId"
                  params={{ contactoId: contacto.id }}
                  className="block"
                >
                  <ContactoListItem
                    nombre={contacto.nombre}
                    cargo={contacto.cargo}
                    email={contacto.email}
                    isActive={activeContactoId === contacto.id}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
