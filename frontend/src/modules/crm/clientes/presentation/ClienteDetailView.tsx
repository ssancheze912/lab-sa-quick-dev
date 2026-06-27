import { isAxiosError } from 'axios'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { ContactManager, ContactServiceProvider } from 'siesa-ui-kit'
import { useClienteById } from '../application/useClienteById'
import { useContactosByCliente } from '../../contactos/application/useContactosByCliente'
import { ClienteContactServiceAdapter } from './ClienteContactServiceAdapter'
import { ClienteFormDialog } from './ClienteFormDialog'
import { DeleteClienteDialog } from './DeleteClienteDialog'

interface Props {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: Props) {
  const { data: cliente, isLoading, isError, error } = useClienteById(clienteId)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: contactos } = useContactosByCliente(clienteId)
  const adapter = useMemo(
    () => new ClienteContactServiceAdapter(clienteId, queryClient, navigate),
    [clienteId, queryClient, navigate],
  )

  /**
   * Event delegation: intercept clicks on ContactManager rows to navigate to contact detail.
   * We detect clicks on <tr> rows (table layout) or contact cards (mobile layout)
   * by finding the nearest ancestor containing a contact name that maps to a loaded contact ID.
   */
  const handleContactManagerClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!contactos?.length) return
      const target = event.target as HTMLElement

      // Find the closest <tr> row (desktop table layout)
      const trRow = target.closest('tr')
      if (trRow) {
        // Get the contact name from the name cell (first meaningful text cell)
        const nameCells = trRow.querySelectorAll('td')
        let contactName: string | undefined
        for (const cell of nameCells) {
          const text = cell.textContent?.trim()
          if (text && text.length > 0) {
            contactName = text
            break
          }
        }
        if (contactName) {
          const matched = contactos.find((c) => c.nombre === contactName)
          if (matched) {
            event.stopPropagation()
            adapter.onContactClick(matched.id)
            return
          }
        }
      }

      // Find contact card (mobile/card layout) — look for the card container
      const card = target.closest('[data-contact-card]') as HTMLElement | null
      if (card) {
        const contactoId = card.dataset.contactId
        if (contactoId) {
          event.stopPropagation()
          adapter.onContactClick(contactoId)
        }
      }
    },
    [contactos, adapter],
  )

  const is404 = isError && isAxiosError(error) && error.response?.status === 404

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex flex-col gap-6 p-8"
      >
        <div className="flex flex-col gap-2">
          <Skeleton width="50%" height={28} />
          <Skeleton width="30%" height={16} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton width="40%" height={12} />
              <Skeleton width="70%" height={18} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (is404) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex flex-col items-center justify-center gap-3 p-8"
      >
        <p
          data-testid="cliente-not-found"
          className="text-slate-500 text-sm text-center"
        >
          Cliente no encontrado
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        data-testid="cliente-detail-panel"
        className="flex-1 flex flex-col items-center justify-center gap-3 p-8"
      >
        <p className="text-slate-500 text-sm text-center">
          No se pudo cargar el detalle del cliente
        </p>
      </div>
    )
  }

  if (!cliente) return null

  return (
    <>
      <div
        data-testid="cliente-detail-panel"
        aria-label="Detalle del cliente"
        className="flex-1 flex flex-col gap-6 p-8 overflow-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{cliente.nombre}</h2>
            <p className="text-sm text-slate-500 mt-1">{cliente.nit}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="btn-editar"
              onClick={() => setIsEditOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-lg hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
            >
              Editar
            </button>
            <button
              type="button"
              data-testid="btn-eliminar"
              onClick={() => setIsDeleteOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              Eliminar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Nombre
            </span>
            <span
              data-testid="cliente-detail-nombre"
              className="text-sm text-slate-800"
            >
              {cliente.nombre}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              NIT/RUC
            </span>
            <span
              data-testid="cliente-detail-nit"
              className="text-sm text-slate-800"
            >
              {cliente.nit}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Teléfono
            </span>
            <span
              data-testid="cliente-detail-telefono"
              className="text-sm text-slate-800"
            >
              {cliente.telefono}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Ciudad
            </span>
            <span
              data-testid="cliente-detail-ciudad"
              className="text-sm text-slate-800"
            >
              {cliente.ciudad}
            </span>
          </div>
        </div>

        <div
          data-testid="contact-manager"
          onClick={handleContactManagerClick}
        >
          <ContactServiceProvider adapter={adapter}>
            <ContactManager recordId={clienteId} />
          </ContactServiceProvider>
        </div>
      </div>

      <ClienteFormDialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        cliente={cliente}
      />

      <DeleteClienteDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        clienteId={cliente.id}
        hasContacts={false}
        onDeleted={() => navigate({ to: '/clientes' })}
      />
    </>
  )
}
