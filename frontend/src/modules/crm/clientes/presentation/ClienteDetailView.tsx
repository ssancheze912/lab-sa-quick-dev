import { Fragment, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { useCliente } from '../application/useCliente'
import { ClienteForm } from './ClienteForm'
import { ClienteDeleteDialog } from './ClienteDeleteDialog'

interface ClienteDetailViewProps {
  clienteId: string
}

/**
 * Right-panel detail view for a single cliente. Renders one of four states:
 *   - loading skeleton (4 field rows)
 *   - error panel (transport / 5xx)
 *   - not-found view (404 translated to `data === null` at the repository)
 *   - definition-list with the four read-only fields
 */
export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, refetch } = useCliente(clienteId)
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <section
        data-testid="cliente-detail-panel"
        aria-label="Detalle del cliente"
        className="p-6"
      >
        <div className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Fragment key={i}>
              <Skeleton height={16} width={80} />
              <Skeleton height={16} />
            </Fragment>
          ))}
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <ErrorPanel
        title="No se pudo cargar el cliente"
        description="Intenta de nuevo en unos segundos."
        onRetry={() => refetch()}
        testId="cliente-detail-error"
      />
    )
  }

  if (data === null || data === undefined) {
    return (
      <section
        data-testid="cliente-not-found"
        aria-label="Cliente no encontrado"
        className="flex flex-col items-center justify-center gap-4 p-12 text-center"
      >
        <h3 className="text-lg font-semibold text-slate-900">
          Cliente no encontrado
        </h3>
        <p className="text-sm text-slate-600">
          El cliente solicitado no existe o fue eliminado.
        </p>
        <button
          type="button"
          onClick={() => router.navigate({ to: '/clientes' })}
          className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40"
        >
          Volver a la lista
        </button>
      </section>
    )
  }

  return (
    <section
      data-testid="cliente-detail-panel"
      aria-label="Detalle del cliente"
    >
      <div className="flex items-center justify-end gap-2 p-6 pb-0">
        <button
          type="button"
          data-testid="btn-eliminar-cliente"
          onClick={() => setIsDeleteOpen(true)}
          aria-label="Eliminar cliente"
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/40"
        >
          Eliminar
        </button>
        <button
          type="button"
          data-testid="btn-editar-cliente"
          onClick={() => setIsEditOpen(true)}
          aria-label="Editar cliente"
          className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40"
        >
          Editar
        </button>
      </div>
      <dl className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-3 p-6">
        <dt className="text-sm font-medium text-slate-500">Nombre</dt>
        <dd data-testid="cliente-detail-nombre" className="text-slate-900">
          {data.nombre}
        </dd>
        <dt className="text-sm font-medium text-slate-500">NIT/RUC</dt>
        <dd data-testid="cliente-detail-nit" className="text-slate-900">
          {data.nit}
        </dd>
        <dt className="text-sm font-medium text-slate-500">Teléfono</dt>
        <dd data-testid="cliente-detail-telefono" className="text-slate-900">
          {data.telefono ?? '—'}
        </dd>
        <dt className="text-sm font-medium text-slate-500">Ciudad</dt>
        <dd data-testid="cliente-detail-ciudad" className="text-slate-900">
          {data.ciudad ?? '—'}
        </dd>
      </dl>
      <ClienteForm
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        cliente={data}
      />
      <ClienteDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        clienteId={data.id}
      />
    </section>
  )
}
