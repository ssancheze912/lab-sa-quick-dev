import axios from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useContacto } from '../application/useContacto'

interface ContactoDetailViewProps {
  contactoId: string
}

export function ContactoDetailView({ contactoId }: ContactoDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useContacto(contactoId)

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
          onClick={refetch}
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

  return (
    <div data-testid="contacto-detail-panel" className="p-6">
      <div className="flex items-center justify-end mb-4 gap-2">
        <button
          type="button"
          data-testid="contacto-edit-button"
          aria-label={`Editar contacto ${data.nombre}`}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
          Editar
        </button>
        <button
          type="button"
          data-testid="contacto-delete-button"
          aria-label={`Eliminar contacto ${data.nombre}`}
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
    </div>
  )
}
