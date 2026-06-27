import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useClientes } from '../../clientes/application/useClientes'
import { useReassignContacto } from '../application/useReassignContacto'

interface Props {
  isOpen: boolean
  onClose: () => void
  contactoId: string
  currentClienteId: string | null
  contactoNombre: string
}

/**
 * Dialog that lets the user reassign a contacto to a different cliente.
 *
 * - Renders the full list of clientes (`useClientes()` → queryKey `['clientes']`).
 * - The currently assigned cliente is filtered out — can't reassign to itself.
 * - Loading clients shows react-loading-skeleton (NOT a spinner).
 * - "Confirmar" is disabled until a cliente is picked.
 * - WCAG 2.1 AA: `aria-label="Seleccionar nuevo cliente"` on the selection list.
 */
export function ReassignClienteDialog({
  isOpen,
  onClose,
  contactoId,
  currentClienteId,
  contactoNombre,
}: Props) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)
  const { data: clientes = [], isLoading } = useClientes()
  const reassignMutation = useReassignContacto(contactoId, currentClienteId)

  // Reset the selection every time the dialog is opened so a stale pick
  // from a previous open does not leak in.
  useEffect(() => {
    if (isOpen) setSelectedClienteId(null)
  }, [isOpen])

  const availableClientes = clientes.filter((c) => c.id !== currentClienteId)

  const handleConfirm = () => {
    if (!selectedClienteId) return
    reassignMutation.mutate(selectedClienteId, {
      onSuccess: () => onClose(),
    })
  }

  const handleCancel = () => {
    if (reassignMutation.isPending) return
    onClose()
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !reassignMutation.isPending) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          role="dialog"
          aria-labelledby="reassign-cliente-dialog-title"
          aria-describedby="reassign-cliente-dialog-description"
          data-testid="reassign-cliente-dialog"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none"
        >
          <Dialog.Title
            id="reassign-cliente-dialog-title"
            className="text-lg font-bold text-slate-900 mb-1"
          >
            Reasignar contacto
          </Dialog.Title>
          <p
            id="reassign-cliente-dialog-description"
            className="text-sm text-slate-500 mb-4"
          >
            Selecciona el nuevo cliente para <strong>{contactoNombre}</strong>.
          </p>

          <div
            className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1"
            aria-label="Seleccionar nuevo cliente"
            role="listbox"
          >
            {isLoading ? (
              <Skeleton count={4} height={36} />
            ) : availableClientes.length === 0 ? (
              <span className="text-sm text-slate-400 italic">
                No hay otros clientes disponibles
              </span>
            ) : (
              availableClientes.map((cliente) => {
                const selected = selectedClienteId === cliente.id
                return (
                  <button
                    key={cliente.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-testid="cliente-option"
                    onClick={() => setSelectedClienteId(cliente.id)}
                    className={
                      selected
                        ? 'px-3 py-2 rounded text-sm text-left font-medium bg-[#0e79fd] text-white'
                        : 'px-3 py-2 rounded text-sm text-left font-medium bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }
                  >
                    {cliente.nombre}
                  </button>
                )
              })
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              data-testid="btn-cancelar-reasignar"
              onClick={handleCancel}
              disabled={reassignMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="btn-confirmar-reasignar"
              onClick={handleConfirm}
              disabled={!selectedClienteId || reassignMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-lg hover:bg-[#154ca9] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reassignMutation.isPending ? 'Reasignando...' : 'Confirmar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
