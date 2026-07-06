import { useState } from 'react'
import { Button } from 'siesa-ui-kit'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useCliente } from '@/modules/crm/clientes/application/useCliente'
import { useDeleteCliente } from '@/modules/crm/clientes/application/useDeleteCliente'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { ClienteForm } from '@/modules/crm/clientes/presentation/ClienteForm'

interface ClienteDetailViewProps {
  clienteId: string
  onDeleted?: () => void
}

export function ClienteDetailView({ clienteId, onDeleted }: ClienteDetailViewProps) {
  const { data, isError, isSuccess, refetch } = useCliente(clienteId)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const deleteCliente = useDeleteCliente()

  const handleConfirmDelete = async () => {
    try {
      await deleteCliente.mutateAsync(clienteId)
      setIsDeleteOpen(false)
      onDeleted?.()
    } catch {
      // Delete failed (e.g. 500/network error): keep the dialog open so the user can retry.
      // Surfaced via `deleteCliente.isPending` resetting to false, re-enabling "Confirmar".
    }
  }

  return (
    <div data-testid="cliente-detail-panel" className="flex flex-1 flex-col p-6">
      {isError && <ErrorPanel message="No se pudo cargar" onRetry={() => refetch()} />}

      {isSuccess && data === null && (
        <EmptyState
          title="Cliente no encontrado"
          subtitle="Verifica el enlace o vuelve a la lista de clientes"
          testId="cliente-not-found"
        />
      )}

      {isSuccess && data && (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <dt className="text-sm font-medium text-slate-500">Nombre</dt>
            <dd data-testid="cliente-detail-nombre" className="text-sm text-slate-900 dark:text-white">
              {data.nombre}
            </dd>

            <dt className="text-sm font-medium text-slate-500">NIT/RUC</dt>
            <dd data-testid="cliente-detail-nit" className="text-sm text-slate-900 dark:text-white">
              {data.nit}
            </dd>

            <dt className="text-sm font-medium text-slate-500">Teléfono</dt>
            <dd data-testid="cliente-detail-telefono" className="text-sm text-slate-900 dark:text-white">
              {data.telefono}
            </dd>

            <dt className="text-sm font-medium text-slate-500">Ciudad</dt>
            <dd data-testid="cliente-detail-ciudad" className="text-sm text-slate-900 dark:text-white">
              {data.ciudad}
            </dd>
          </dl>

          <div className="mt-4 flex gap-2">
            <Button htmlType="button" size="sm" onClick={() => setIsEditOpen(true)}>
              Editar
            </Button>
            <Button htmlType="button" size="sm" type="outline" onClick={() => setIsDeleteOpen(true)}>
              Eliminar
            </Button>
          </div>

          <ClienteForm open={isEditOpen} onOpenChange={setIsEditOpen} cliente={data} />

          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar este cliente?</DialogTitle>
              </DialogHeader>

              <DialogFooter>
                <Button type="outline" htmlType="button" onClick={() => setIsDeleteOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  htmlType="button"
                  disabled={deleteCliente.isPending}
                  onClick={handleConfirmDelete}
                >
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
