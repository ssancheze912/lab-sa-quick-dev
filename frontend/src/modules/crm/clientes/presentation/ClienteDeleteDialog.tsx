import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useDeleteCliente } from '../application/useDeleteCliente'

interface ClienteDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
}

/**
 * Destructive confirmation dialog for deleting a cliente. Story 2.5.
 *
 * Renders an alertdialog with `[Cancelar]` (focused by default — safe
 * default for destructive actions per UX spec §Navegación por teclado)
 * and `[Confirmar]` (red destructive). The dialog stays open while the
 * mutation is pending and switches the Confirmar label to `"Eliminando…"`.
 *
 * Behavior:
 *   - 204 (success):       success toast + close + navigate to /clientes.
 *   - 204 + orphan header: compound toast (longer copy, 5s).
 *   - 404 (vanished row):  informational toast + close + navigate (treated
 *                          as soft-success — the user's intent is honored
 *                          by a different mechanism). The cache is manually
 *                          invalidated here because TanStack's `onSuccess`
 *                          only fires on a 2xx response.
 *   - 5xx / network:       red toast + dialog STAYS OPEN with retry possible.
 */
export function ClienteDeleteDialog({
  open,
  onOpenChange,
  clienteId,
}: ClienteDeleteDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mutation = useDeleteCliente()
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  // Focus the Cancelar button when the dialog opens — safe default for a
  // destructive action (per UX spec §Modal & Overlay Patterns).
  useEffect(() => {
    if (open) {
      // Defer focus to the next paint so Radix has mounted the content.
      const timer = setTimeout(() => cancelBtnRef.current?.focus(), 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  function handleSuccess(contactosOrphaned: number) {
    if (contactosOrphaned > 0) {
      toast.success(
        'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.',
        { duration: 5000 },
      )
    } else {
      toast.success('Cliente eliminado correctamente', { duration: 3000 })
    }
    onOpenChange(false)
    void router.navigate({ to: '/clientes' })
  }

  function handleConfirm() {
    mutation.mutate(
      { id: clienteId },
      {
        onSuccess: (result) => handleSuccess(result.contactosOrphaned),
        onError: (err) => {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            // The row vanished between fetch and DELETE — treat as soft-success.
            // The `useDeleteCliente` hook only invalidates on 2xx, so the
            // component manually syncs the caches here.
            queryClient.invalidateQueries({ queryKey: ['clientes'] })
            queryClient.removeQueries({ queryKey: ['clientes', clienteId] })
            toast.info('Cliente no encontrado. La lista se actualizó.', {
              duration: 5000,
            })
            onOpenChange(false)
            void router.navigate({ to: '/clientes' })
            return
          }

          // 5xx + network — dialog stays open, red toast, user can retry.
          toast.error('No se pudo eliminar. Intenta de nuevo.', { duration: 5000 })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="cliente-delete-dialog"
        role="alertdialog"
        aria-modal="true"
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>¿Eliminar este cliente?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Esta acción no se puede deshacer.
        </p>
        <DialogFooter>
          <button
            type="button"
            ref={cancelBtnRef}
            data-testid="btn-cancelar-eliminar"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="btn-confirmar-eliminar"
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Eliminando…' : 'Confirmar'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
