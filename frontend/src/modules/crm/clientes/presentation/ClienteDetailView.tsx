import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useCliente } from '../application/useCliente'
import { useClienteDetailStore } from '../application/clienteDetailStore'
import { useDeleteCliente } from '../application/useDeleteCliente'
import { useContactosPorCliente } from '../../contactos/application/useContactosPorCliente'
import { ClienteForm } from './ClienteForm'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../shared/components/ui/alert-dialog'

interface ClienteDetailViewProps {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError } = useCliente(clienteId)
  const setClienteNotFound = useClienteDetailStore((s) => s.setClienteNotFound)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const navigate = useNavigate()

  const contactosResult = useContactosPorCliente(clienteId)
  const hasContacts = ((contactosResult?.data)?.length ?? 0) > 0

  const { mutate, isPending } = useDeleteCliente({
    onSuccess: () => {
      if (hasContacts) {
        toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
      } else {
        toast.success('Cliente eliminado correctamente')
      }
      navigate({ to: '/clientes' })
    },
  })

  useEffect(() => {
    setClienteNotFound(!isLoading && (isError || !data))
    return () => {
      setClienteNotFound(false)
    }
  }, [isLoading, isError, data, setClienteNotFound])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6">
          <Skeleton height={24} width="60%" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`skeleton-field-${i}`} className="mb-4">
            <Skeleton height={12} width="30%" className="mb-1" />
            <Skeleton height={16} width="70%" />
          </div>
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div data-testid="cliente-not-found" className="flex flex-1 flex-col items-center justify-center text-slate-500">
        <p className="text-sm">No se encontró el cliente solicitado.</p>
      </div>
    )
  }

  return (
    <div data-testid="cliente-detail-content" className="flex flex-1 flex-col p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900 pointer-events-none">{data.nombre}</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="edit-cliente-button"
            onClick={() => setIsEditFormOpen(true)}
            className="flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            data-testid="delete-cliente-button"
            aria-label="Eliminar cliente"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-1 rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
            Eliminar
          </button>
        </div>
      </div>
      <dl className="space-y-4" aria-label="Detalle del cliente">
        <div>
          <dt className="text-sm font-medium text-slate-900">Nombre</dt>
          <dd className="text-sm text-slate-700">{data.nombre}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-900">NIT/RUC</dt>
          <dd className="text-sm text-slate-700">{data.nit}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-900">Teléfono</dt>
          <dd className="text-sm text-slate-700">{data.telefono}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-900">Ciudad</dt>
          <dd className="text-sm text-slate-700">{data.ciudad}</dd>
        </div>
      </dl>

      {isEditFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-cliente-dialog-title"
          data-testid="edit-cliente-form-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onKeyDown={(e) => e.key === 'Escape' && setIsEditFormOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditFormOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3
              id="edit-cliente-dialog-title"
              className="mb-4 text-base font-semibold text-slate-900"
            >
              Editar cliente
            </h3>
            <ClienteForm
              mode="edit"
              initialValues={{
                id: data.id,
                nombre: data.nombre,
                nit: data.nit,
                telefono: data.telefono,
                ciudad: data.ciudad,
              }}
              onClose={() => setIsEditFormOpen(false)}
              onSuccess={() => setIsEditFormOpen(false)}
            />
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!isPending) setIsDeleteDialogOpen(open) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente <strong>{data.nombre}</strong> será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-testid="delete-cancel-button"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <button
              type="button"
              data-testid="delete-confirm-button"
              aria-label="Confirmar eliminación de cliente"
              onClick={() => { if (!isPending) mutate(clienteId) }}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {isPending ? 'Eliminando...' : 'Confirmar'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
