import { useState } from 'react'
import axios from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { PencilSquareIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { ToastProvider } from 'siesa-ui-kit'
import { Link, useNavigate } from '@tanstack/react-router'
import { useContacto } from '../application/useContacto'
import { useDeleteContacto } from '../application/useDeleteContacto'
import { ContactoForm } from './ContactoForm'

interface ContactoDetailViewProps {
  contactoId: string
}

function ContactoDetailViewInner({ contactoId }: ContactoDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useContacto(contactoId)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const navigate = useNavigate()

  const deleteMutation = useDeleteContacto({
    onSuccess: () => {
      setIsDeleteDialogOpen(false)
      navigate({ to: '/contactos' })
    },
  })

  if (isLoading) {
    return (
      <div data-testid="contacto-detail-skeleton" className="p-6">
        <Skeleton height={28} className="mb-4" />
        <Skeleton height={20} count={4} className="mb-2" />
      </div>
    )
  }

  if (isError) {
    const is404 = axios.isAxiosError(error) && error.response?.status === 404
    if (is404) {
      return (
        <div
          data-testid="contacto-detail-not-found"
          className="flex flex-col items-center justify-center p-8 text-center"
        >
          <p className="text-slate-500 text-sm">Contacto no encontrado</p>
        </div>
      )
    }

    return (
      <div
        data-testid="contacto-detail-error-panel"
        className="flex flex-col items-center justify-center p-8 text-center gap-4"
      >
        <p className="text-slate-600 text-sm">
          No se pudo cargar el contacto. Intenta de nuevo.
        </p>
        <button
          data-testid="contacto-detail-retry-button"
          onClick={() => void refetch()}
          className="px-4 py-2 bg-[#0e79fd] text-white text-sm rounded hover:bg-[#154ca9] transition-colors"
          type="button"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div
        data-testid="contacto-detail-not-found"
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <p className="text-slate-500 text-sm">Contacto no encontrado</p>
      </div>
    )
  }

  if (isEditFormOpen) {
    return (
      <div data-testid="contacto-detail-edit-form" className="p-6">
        <ContactoForm
          mode="edit"
          contacto={data}
          onSuccess={() => setIsEditFormOpen(false)}
          onCancel={() => setIsEditFormOpen(false)}
        />
      </div>
    )
  }

  return (
    <div data-testid="contacto-detail-panel" className="p-6">
      <div className="mb-4">
        {data.clienteId ? (
          <Link
            to="/clientes/$clienteId"
            params={{ clienteId: data.clienteId }}
            data-testid="contacto-back-link"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Volver al cliente
          </Link>
        ) : (
          <Link
            to="/contactos"
            data-testid="contacto-back-link"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Volver a contactos
          </Link>
        )}
      </div>
      <div className="flex items-center justify-end mb-4 gap-2">
        <button
          type="button"
          data-testid="contacto-edit-button"
          aria-label={`Editar contacto ${data.nombre}`}
          onClick={() => setIsEditFormOpen(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
          Editar
        </button>
        <button
          type="button"
          data-testid="contacto-delete-button"
          aria-label={`Eliminar contacto ${data.nombre}`}
          onClick={() => setIsDeleteDialogOpen(true)}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
        >
          <TrashIcon className="w-4 h-4" aria-hidden="true" />
          Eliminar
        </button>
      </div>

      <dl className="space-y-3">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</dt>
          <dd data-testid="contacto-detail-nombre" className="text-sm text-slate-800 mt-0.5">
            {data.nombre}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cargo</dt>
          <dd data-testid="contacto-detail-cargo" className="text-sm text-slate-800 mt-0.5">
            {data.cargo}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd data-testid="contacto-detail-telefono" className="text-sm text-slate-800 mt-0.5">
            {data.telefono}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</dt>
          <dd data-testid="contacto-detail-email" className="text-sm text-slate-800 mt-0.5">
            {data.email}
          </dd>
        </div>
      </dl>

      {isDeleteDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contacto-delete-dialog-title"
          aria-describedby="contacto-delete-dialog-description"
          data-testid="contacto-detail-delete-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2
              id="contacto-delete-dialog-title"
              className="text-lg font-semibold text-slate-800 mb-2"
            >
              ¿Eliminar este contacto?
            </h2>
            <p id="contacto-delete-dialog-description" className="text-sm text-slate-500 mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                data-testid="contacto-detail-delete-cancel"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="contacto-detail-delete-confirm"
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

export function ContactoDetailView(props: ContactoDetailViewProps) {
  return (
    <ToastProvider>
      <ContactoDetailViewInner {...props} />
    </ToastProvider>
  )
}
