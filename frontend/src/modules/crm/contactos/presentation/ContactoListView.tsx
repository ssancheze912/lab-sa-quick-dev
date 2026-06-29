import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useContactos } from '../application/useContactos'
import { ContactListItem } from './ContactListItem'

export function ContactoListView() {
  const { data, isLoading, isError, refetch } = useContactos()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContactos = useMemo(() => {
    if (!searchQuery.trim()) return data ?? []
    const q = searchQuery.toLowerCase()
    return (data ?? []).filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  if (isLoading) {
    return (
      <div data-testid="contactos-list-skeleton" className="p-4">
        <Skeleton height={36} className="mb-3" />
        <Skeleton height={24} className="mb-2" count={8} />
      </div>
    )
  }

  if (isError) {
    return (
      <div
        data-testid="contactos-error-panel"
        className="flex flex-col items-center justify-center p-8 text-center gap-4"
      >
        <p className="text-slate-600 text-sm">
          No se pudo cargar la lista de contactos. Intenta de nuevo.
        </p>
        <button
          data-testid="contactos-retry-button"
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#0e79fd] text-white text-sm rounded hover:bg-[#154ca9] transition-colors"
          type="button"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (data && data.length === 0) {
    return (
      <div
        data-testid="contactos-empty-state"
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <p className="text-slate-500 text-sm">
          No hay contactos registrados. Cree el primer contacto para comenzar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <input
          data-testid="contactos-search-input"
          type="text"
          placeholder="Buscar contacto por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0e79fd]"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {filteredContactos.map((contacto) => (
          <div
            key={contacto.id}
            data-testid="contacto-row"
          >
            <div data-testid={`contacto-item-${contacto.id}`}>
              <ContactListItem contacto={contacto} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
