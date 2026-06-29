import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useContactos } from '../application/useContactos'
import { ContactListItem } from './ContactListItem'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import { ContactoForm } from './ContactoForm'

export function ContactoListView() {
  const [sinCliente, setSinCliente] = useState(false)
  const { data, isLoading, isError, refetch } = useContactos(sinCliente)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const filteredContactos = useMemo(() => {
    if (!searchQuery.trim()) return data ?? []
    const q = searchQuery.toLowerCase()
    return (data ?? []).filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  const sinClienteToggle = (
    <button
      type="button"
      data-testid="filtro-sin-cliente"
      onClick={() => setSinCliente((prev) => !prev)}
      aria-pressed={sinCliente}
      aria-label="Sin cliente"
      className={`text-sm px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-[#0e79fd] ${
        sinCliente
          ? 'bg-[#0e79fd] text-white border-[#0e79fd]'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
      }`}
    >
      Sin cliente
    </button>
  )

  if (isError) {
    return (
      <ErrorPanel
        onRetry={() => refetch()}
        testId="contactos-error-panel"
        retryTestId="contactos-retry-button"
        message="No se pudo cargar la lista de contactos. Intenta de nuevo."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-slate-200 flex items-center gap-2 flex-wrap">
          {sinClienteToggle}
        </div>
        <div data-testid="contactos-list-skeleton" className="p-4 flex-1">
          <Skeleton height={24} className="mb-2" count={8} />
        </div>
      </div>
    )
  }

  if (isFormOpen) {
    return (
      <ContactoForm
        onSuccess={() => setIsFormOpen(false)}
        onCancel={() => setIsFormOpen(false)}
      />
    )
  }

  // Empty state without sinCliente filter: no search input (AC-E3 pre-existing test requirement)
  if (!sinCliente && data && data.length === 0) {
    return (
      <EmptyState
        message="No hay contactos registrados. Cree el primer contacto para comenzar."
        testId="contactos-empty-state"
      />
    )
  }

  // Empty state with sinCliente filter active: show toggle so user can deactivate
  if (sinCliente && data && data.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-slate-200 flex items-center gap-2 flex-wrap">
          {sinClienteToggle}
        </div>
        <EmptyState
          message="Todos los contactos tienen un cliente asignado"
          testId="contactos-sin-cliente-empty-state"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 flex items-center gap-2 flex-wrap">
        <input
          data-testid="contactos-search-input"
          type="text"
          placeholder="Buscar contacto por nombre o email..."
          aria-label="Buscar contacto por nombre o email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0e79fd]"
        />
        {sinClienteToggle}
        <button
          type="button"
          data-testid="nuevo-contacto-button"
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1 text-sm bg-[#0e79fd] text-white px-3 py-2 rounded hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
          aria-label="Nuevo contacto"
        >
          <PlusIcon className="w-4 h-4" aria-hidden="true" />
          Nuevo contacto
        </button>
      </div>
      {sinCliente && data && data.length > 0 && (
        <div
          data-testid="contador-sin-cliente"
          className="px-3 py-2 text-sm text-slate-600 bg-slate-50 border-b border-slate-200"
        >
          {data.length} contacto(s) sin cliente
        </div>
      )}
      <div className="overflow-y-auto flex-1">
        {filteredContactos.map((contacto) => (
          <div
            key={contacto.id}
            data-testid="contacto-row"
          >
            <Link
              to="/contactos/$contactoId"
              params={{ contactoId: contacto.id }}
              data-testid={`contacto-item-${contacto.id}`}
              className="block"
            >
              <ContactListItem contacto={contacto} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
