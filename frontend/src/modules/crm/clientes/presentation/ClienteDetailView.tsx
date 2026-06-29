import { useState, type CSSProperties } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ToastProvider, toast } from 'siesa-ui-kit'
import { useCliente } from '../application/useCliente'
import { useDeleteCliente } from '../application/useDeleteCliente'
import { useContactosByCliente } from '../../contactos/application/useContactosByCliente'
import { ClienteForm } from './ClienteForm'

interface ClienteDetailViewProps {
  clienteId: string | null
  style?: CSSProperties
  className?: string
}

function ContactosSeccion({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError, refetch } = useContactosByCliente(clienteId)

  if (isLoading) {
    return (
      <div data-testid="contactos-skeleton" className="mt-6">
        <Skeleton height={20} count={3} className="mb-2" />
      </div>
    )
  }

  if (isError) {
    return (
      <div data-testid="contactos-error-state" className="mt-6">
        <p className="text-sm text-slate-500 mb-2">No se pudo cargar los contactos. Intenta de nuevo.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div data-testid="cliente-contactos-seccion" className="mt-6">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Contactos</h3>
      {!data || data.length === 0 ? (
        <div data-testid="contactos-empty-state" className="text-sm text-slate-400">
          Sin contactos asociados
        </div>
      ) : (
        <ul data-testid="contactos-lista" className="space-y-2">
          {data.map((contacto) => (
            <li key={contacto.id} className="flex flex-col py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm font-medium text-slate-800">{contacto.nombre}</span>
              <span className="text-xs text-slate-500">{contacto.cargo}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ClienteDetailViewInner({ clienteId, style, className }: ClienteDetailViewProps) {
  const { data, isLoading, isError } = useCliente(clienteId)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  const hasAssociatedContacts = (data?.contactCount ?? 0) > 0

  const deleteMutation = useDeleteCliente({
    hasAssociatedContacts,
    onSuccess: () => {
      setIsDeleteDialogOpen(false)
      setIsDeleted(true)
      const toastMessage = hasAssociatedContacts
        ? 'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.'
        : 'Cliente eliminado correctamente'
      toast.success(toastMessage)
    },
    onError: () => {
      toast.error('Error al eliminar el cliente')
    },
  })

  if (isDeleted) {
    return (
      <div
        data-testid="empty-state"
        style={style}
        className={`flex flex-col items-center justify-center p-8 text-center ${className ?? ''}`}
      >
        <p className="text-slate-400 text-sm">Selecciona un cliente para ver sus detalles</p>
      </div>
    )
  }

  if (!clienteId) {
    return (
      <div
        data-testid="cliente-detail-empty"
        style={style}
        className={`flex flex-col items-center justify-center p-8 text-center ${className ?? ''}`}
      >
        <span data-testid="cliente-detail-empty-state" />
        <p className="text-slate-400 text-sm">Selecciona un cliente para ver sus detalles</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-skeleton"
        style={style}
        className={`p-6 ${className ?? ''}`}
      >
        <Skeleton height={28} className="mb-4" />
        <Skeleton height={20} count={4} className="mb-2" />
        <ContactosSeccion clienteId={clienteId} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        data-testid="cliente-detail-not-found"
        style={style}
        className={`flex flex-col items-center justify-center p-8 text-center ${className ?? ''}`}
      >
        <p className="text-slate-500 text-sm">Cliente no encontrado</p>
      </div>
    )
  }

  if (isEditFormOpen) {
    return (
      <div
        data-testid="cliente-detail-edit-form"
        style={style}
        className={`p-6 ${className ?? ''}`}
      >
        <ClienteForm
          mode="edit"
          cliente={data}
          onSuccess={() => setIsEditFormOpen(false)}
          onCancel={() => setIsEditFormOpen(false)}
        />
      </div>
    )
  }

  return (
    <div
      data-testid="cliente-detail-panel"
      style={style}
      className={`p-6 ${className ?? ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">{data.nombre}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="cliente-detail-edit-button"
            aria-label={`Editar cliente ${data.nombre}`}
            onClick={() => setIsEditFormOpen(true)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            data-testid="cliente-detail-delete-button"
            aria-label={`Eliminar cliente ${data.nombre}`}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
          >
            <TrashIcon className="w-4 h-4" aria-hidden="true" />
            Eliminar
          </button>
        </div>
      </div>

      <dl className="space-y-3">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
          <dd data-testid="cliente-detail-nombre" className="text-sm text-slate-800 mt-0.5">
            {data.nombre}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</dt>
          <dd data-testid="cliente-detail-nit" className="text-sm text-slate-800 mt-0.5">
            {data.nit}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd data-testid="cliente-detail-telefono" className="text-sm text-slate-800 mt-0.5">
            {data.telefono}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</dt>
          <dd data-testid="cliente-detail-ciudad" className="text-sm text-slate-800 mt-0.5">
            {data.ciudad}
          </dd>
        </div>
      </dl>

      <ContactosSeccion clienteId={data.id} />

      {isDeleteDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          data-testid="cliente-detail-delete-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2
              id="delete-dialog-title"
              className="text-lg font-semibold text-slate-800 mb-2"
            >
              ¿Eliminar este cliente?
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                data-testid="cliente-detail-delete-cancel"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="cliente-detail-delete-confirm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(data.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ClienteDetailView(props: ClienteDetailViewProps) {
  return (
    <ToastProvider>
      <ClienteDetailViewInner {...props} />
    </ToastProvider>
  )
}
