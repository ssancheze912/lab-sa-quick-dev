import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useRouter } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useContactoById } from '../application/useContactoById'
import { useClienteById } from '../../clientes/application/useClienteById'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import { ContactoFormDialog } from './ContactoFormDialog'
import { DeleteContactoDialog } from './DeleteContactoDialog'
import { ReassignClienteDialog } from './ReassignClienteDialog'

interface Props {
  contactoId: string
}

export function ContactoDetailPanel({ contactoId }: Props) {
  const { data, isLoading, isError, error } = useContactoById(contactoId)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isReassignOpen, setIsReassignOpen] = useState(false)
  const router = useRouter()

  const { data: cliente, isLoading: isClienteLoading } = useClienteById(
    data?.clienteId ?? undefined
  )

  const is404 = isError && isAxiosError(error) && error.response?.status === 404

  if (isLoading) {
    return (
      <div data-testid="contacto-detail-panel" className="p-6 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton width="30%" height={12} />
            <Skeleton width="60%" height={16} />
          </div>
        ))}
      </div>
    )
  }

  if (is404) {
    return (
      <div data-testid="contacto-not-found" className="p-6 text-slate-500 text-sm">
        Contacto no encontrado
      </div>
    )
  }

  if (isError) {
    return <ErrorPanel />
  }

  if (!data) return null

  return (
    <div
      data-testid="contacto-detail-panel"
      aria-label="Detalle del contacto"
      className="p-6 flex flex-col gap-5"
    >
      <button
        type="button"
        data-testid="btn-volver"
        aria-label="Volver a la vista anterior"
        onClick={() => router.history.back()}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-0 self-start"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
            clipRule="evenodd"
          />
        </svg>
        Volver
      </button>

      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-semibold text-slate-800">Detalle</span>
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="btn-editar"
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 text-sm rounded-md bg-[#0e79fd] text-white hover:bg-[#154ca9]"
          >
            Editar
          </button>
          <button
            type="button"
            data-testid="btn-eliminar"
            onClick={() => setDeleteDialogOpen(true)}
            className="px-4 py-2 text-sm rounded-md bg-[#0e79fd] text-white hover:bg-[#154ca9]"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Nombre
        </span>
        <span
          data-testid="contacto-detail-nombre"
          className="text-sm font-medium text-slate-800"
        >
          {data.nombre}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Cargo
        </span>
        <span
          data-testid="contacto-detail-cargo"
          className="text-sm text-slate-700"
        >
          {data.cargo}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Teléfono
        </span>
        <span
          data-testid="contacto-detail-telefono"
          className="text-sm text-slate-700"
        >
          {data.telefono}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Email
        </span>
        <span
          data-testid="contacto-detail-email"
          className="text-sm text-slate-700"
        >
          {data.email}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wide">
          Cliente
        </span>
        {data.clienteId === null || data.clienteId === undefined ? (
          <span
            data-testid="sin-cliente-asignado"
            className="text-sm text-slate-400 italic"
          >
            Sin cliente asignado
          </span>
        ) : isClienteLoading ? (
          <Skeleton width="50%" height={16} />
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/clientes/$clienteId"
              params={{ clienteId: data.clienteId }}
              data-testid="clienteAsociadoLink"
              aria-label="Ir al cliente asociado"
              className="text-sm font-medium text-[#0e79fd] hover:underline"
            >
              {cliente?.nombre ?? data.clienteId}
            </Link>
            <button
              type="button"
              data-testid="btn-reasignar"
              aria-label="Reasignar contacto a otro cliente"
              onClick={() => setIsReassignOpen(true)}
              className="text-xs text-slate-500 hover:text-[#0e79fd] underline ml-2"
            >
              Reasignar
            </button>
          </div>
        )}
      </div>

      <ContactoFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contacto={data}
      />

      <DeleteContactoDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        contactoId={data.id}
      />

      <ReassignClienteDialog
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        contactoId={contactoId}
        currentClienteId={data.clienteId ?? null}
        contactoNombre={data.nombre}
      />
    </div>
  )
}
