import * as Dialog from '@radix-ui/react-dialog'
import { useDeleteContacto } from '../application/useDeleteContacto'
import { useNavigate } from '@tanstack/react-router'

interface Props {
  open: boolean
  onClose: () => void
  contactoId: string
}

export function DeleteContactoDialog({ open, onClose, contactoId }: Props) {
  const deleteMutation = useDeleteContacto()
  const navigate = useNavigate()

  const handleConfirm = () => {
    deleteMutation.mutate(contactoId, {
      onSuccess: () => {
        onClose()
        navigate({ to: '/contactos' })
      },
    })
  }

  const handleCancel = () => {
    if (deleteMutation.isPending) return
    onClose()
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !deleteMutation.isPending) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          role="alertdialog"
          aria-labelledby="delete-contacto-dialog-title"
          aria-describedby="delete-contacto-dialog-description"
          data-testid="delete-contacto-dialog"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none"
        >
          <Dialog.Title
            id="delete-contacto-dialog-title"
            className="text-lg font-bold text-slate-900 mb-2"
          >
            Eliminar contacto
          </Dialog.Title>
          <p id="delete-contacto-dialog-description" className="text-sm text-slate-500 mb-6">
            ¿Eliminar este contacto?
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              data-testid="btn-cancelar-eliminar"
              onClick={handleCancel}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="btn-confirmar-eliminar"
              onClick={handleConfirm}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-lg hover:bg-[#154ca9] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
