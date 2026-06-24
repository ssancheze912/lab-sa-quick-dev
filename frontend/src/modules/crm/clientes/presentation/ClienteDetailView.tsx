import { useState } from 'react'
import type { AxiosError } from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { AlertDialog, Button } from 'siesa-ui-kit'
import { useCliente } from '../application/useCliente'
import { ClienteForm } from './ClienteForm'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface ClienteDetailViewProps {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  const isNotFound = isError && (error as AxiosError)?.response?.status === 404

  if (isLoading) {
    return (
      <section
        data-testid="cliente-detail-view"
        aria-label="Detalle del cliente"
        className="flex-1 p-6"
      >
        <div data-testid="cliente-detail-skeleton" className="space-y-4">
          <Skeleton height={24} />
          <Skeleton height={24} />
          <Skeleton height={24} />
          <Skeleton height={24} />
        </div>
      </section>
    )
  }

  if (isNotFound) {
    return (
      <section
        data-testid="cliente-detail-view"
        aria-label="Detalle del cliente"
        className="flex-1 p-6 flex items-center justify-center"
      >
        <p data-testid="cliente-not-found" className="text-slate-500 text-sm">
          Cliente no encontrado.
        </p>
      </section>
    )
  }

  if (isError) {
    return (
      <section
        data-testid="cliente-detail-view"
        aria-label="Detalle del cliente"
        className="flex-1"
      >
        <ErrorPanel onRetry={() => void refetch()} />
      </section>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section
      data-testid="cliente-detail-view"
      aria-label="Detalle del cliente"
      className="flex-1 p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Información del cliente</p>
        <Button
          htmlType="button"
          type="outline"
          data-testid="editar-cliente-button"
          onClick={() => setIsEditFormOpen(true)}
        >
          <PencilSquareIcon className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</p>
        <p data-testid="cliente-detail-nombre" className="text-sm text-slate-800">
          {data.nombre}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">NIT/RUC</p>
        <p data-testid="cliente-detail-nit" className="text-sm text-slate-800">
          {data.nit}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</p>
        <p data-testid="cliente-detail-telefono" className="text-sm text-slate-800">
          {data.telefono}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ciudad</p>
        <p data-testid="cliente-detail-ciudad" className="text-sm text-slate-800">
          {data.ciudad}
        </p>
      </div>

      {isEditFormOpen && (
        <AlertDialog
          title="Editar cliente"
          isOpen={isEditFormOpen}
          onCancel={() => setIsEditFormOpen(false)}
          showCloseButton
          hideCancel
          size="max-w-lg"
          actions={
            <ClienteForm
              clienteId={data.id}
              defaultValues={{
                nombre: data.nombre,
                nit: data.nit,
                telefono: data.telefono,
                ciudad: data.ciudad,
              }}
              onSuccess={() => setIsEditFormOpen(false)}
              onCancel={() => setIsEditFormOpen(false)}
            />
          }
        />
      )}
    </section>
  )
}
