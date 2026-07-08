import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { ClienteForm } from './ClienteForm'
import { useCreateCliente } from '../application/useCreateCliente'
import type { ClienteFormValues } from '../application/clienteSchema'

export interface ClienteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal shell that wires `ClienteForm` to the `useCreateCliente` mutation.
 * Owns dialog open/close state at the parent — this component is a controlled
 * wrapper. On success the dialog closes; on 409 / 500 it stays open and lets
 * the form surface the error inline / at the top.
 */
export function ClienteFormDialog({ open, onOpenChange }: ClienteFormDialogProps) {
  const mutation = useCreateCliente()

  const handleSubmit = (values: ClienteFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        mutation.reset()
        onOpenChange(false)
      },
    })
  }

  const handleCancel = () => {
    if (mutation.isPending) return
    mutation.reset()
    onOpenChange(false)
  }

  const submitError = mutation.error ?? null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && mutation.isPending) return
        if (!next) mutation.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent aria-describedby={undefined} data-testid="cliente-form-dialog">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <ClienteForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending}
          submitError={submitError}
        />
      </DialogContent>
    </Dialog>
  )
}
