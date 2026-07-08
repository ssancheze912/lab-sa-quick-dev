import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { ClienteForm } from './ClienteForm'
import { useUpdateCliente } from '../application/useUpdateCliente'
import type { ClienteFormValues } from '../application/clienteSchema'
import type { Cliente } from '../domain/Cliente'

export interface ClienteEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The current cliente being edited — pre-fills the form. */
  cliente: Cliente
}

/**
 * Modal shell that wires the reusable `ClienteForm` (Story 2.3) to the
 * `useUpdateCliente` mutation. Pre-fills the form with the current cliente
 * values (AC #1). On success invalidates both cache keys and closes; on
 * 409 / 404 / 500 the dialog stays open and lets the form surface the error
 * inline / at the top.
 */
export function ClienteEditDialog({ open, onOpenChange, cliente }: ClienteEditDialogProps) {
  const mutation = useUpdateCliente()

  const handleSubmit = (values: ClienteFormValues) => {
    mutation.mutate(
      { id: cliente.id, values },
      {
        onSuccess: () => {
          mutation.reset()
          onOpenChange(false)
        },
      },
    )
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
      <DialogContent aria-describedby={undefined} data-testid="cliente-edit-dialog">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <ClienteForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending}
          submitError={submitError}
          defaultValues={{
            nombre: cliente.nombre,
            nit: cliente.nit,
            telefono: cliente.telefono,
            ciudad: cliente.ciudad,
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
