import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../shared/components/ui/dialog'
import { useDesasociarContacto } from '../application/useDesasociarContacto'

interface ConfirmarDesasociarDialogProps {
  contactoId: string
  contactoNombre: string
  clienteId: string
  open: boolean
  onClose: () => void
}

export function ConfirmarDesasociarDialog({
  contactoId,
  contactoNombre,
  clienteId,
  open,
  onClose,
}: ConfirmarDesasociarDialogProps) {
  const { mutate, isPending } = useDesasociarContacto()

  function handleConfirm() {
    mutate(
      { contactoId, clienteId },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent aria-describedby={undefined} aria-labelledby="desasociar-contacto-dialog-title">
        <DialogHeader>
          <DialogTitle id="desasociar-contacto-dialog-title">Desasociar contacto</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-slate-600 mt-2">
          ¿Deseas desasociar a <span className="font-medium">{contactoNombre}</span> de este cliente? El contacto no será eliminado.
        </p>

        <DialogFooter className="mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Desasociar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
