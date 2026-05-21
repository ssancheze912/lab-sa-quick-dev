import * as Dialog from '@radix-ui/react-dialog'
import { toast } from '../../../../shared/lib/toastStore'
import { useDeleteCliente } from '../application/useDeleteCliente'

interface DeleteClienteDialogProps {
  open: boolean
  onClose: () => void
  clienteId: string
  hasContacts: boolean
  onDeleted: () => void
}

export function DeleteClienteDialog({
  open,
  onClose,
  clienteId,
  hasContacts,
  onDeleted,
}: DeleteClienteDialogProps) {
  const deleteMutation = useDeleteCliente()

  const handleConfirm = () => {
    deleteMutation.mutate(clienteId, {
      onSuccess: () => {
        if (hasContacts) {
          toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
        } else {
          toast.success('Cliente eliminado correctamente')
        }
        onClose()
        onDeleted()
      },
    })
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          data-testid="delete-cliente-dialog"
          role="alertdialog"
          aria-labelledby="delete-dialog-title"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title
            id="delete-dialog-title"
            className="text-lg font-bold text-slate-900 mb-2"
          >
            ¿Eliminar este cliente?
          </Dialog.Title>

          <p className="text-sm text-slate-500 mb-6">
            Esta acción no se puede deshacer.
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
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
