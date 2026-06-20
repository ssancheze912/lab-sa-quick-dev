import { useState } from 'react'
import type { AxiosError } from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useCliente } from '../application/useCliente'
import { ClienteDetailPlaceholder } from '../../../../shared/components/ClienteDetailPlaceholder'
import { EditarClienteDialog } from './EditarClienteDialog'
import type { ClienteFormValues } from '../application/clienteSchema'

interface ClienteDetailViewProps {
  clienteId: string | null
}

interface DetailFieldProps {
  label: string
  value: string
  testId: string
}

function DetailField({ label, value, testId }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-800" data-testid={testId}>{value}</span>
    </div>
  )
}

function ClienteDetailContent({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError, error, refetch } = useCliente(clienteId)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const is404 = isError && (error as AxiosError)?.response?.status === 404

  if (isLoading) {
    return (
      <div
        data-testid="cliente-detail-loading-skeleton"
        className="p-6 flex flex-col gap-3"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={40} className="mb-3" />
        ))}
      </div>
    )
  }

  if (is404) {
    return (
      <div
        role="status"
        data-testid="cliente-detail-not-found"
        className="flex flex-1 items-center justify-center p-8 text-center"
      >
        <p className="text-slate-500 text-sm">No se encontró este cliente.</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        data-testid="cliente-detail-error-panel"
        className="flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-600"
      >
        <p className="text-sm">No se pudo cargar los datos. Verifica tu conexión.</p>
        <button
          type="button"
          onClick={() => { void refetch() }}
          data-testid="cliente-detail-retry-button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) return null

  const defaultValues: ClienteFormValues = {
    nombre: data.nombre,
    nit: data.nit,
    telefono: data.telefono,
    ciudad: data.ciudad,
  }

  return (
    <div
      data-testid="cliente-detail-panel"
      className="flex flex-col p-6"
    >
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          data-testid="editar-cliente-btn"
          onClick={() => setIsEditDialogOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#154ca9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
        >
          Editar
        </button>
      </div>

      <DetailField label="Nombre" value={data.nombre} testId="cliente-detail-nombre" />
      <DetailField label="NIT/RUC" value={data.nit} testId="cliente-detail-nit" />
      <DetailField label="Teléfono" value={data.telefono} testId="cliente-detail-telefono" />
      <DetailField label="Ciudad" value={data.ciudad} testId="cliente-detail-ciudad" />

      <EditarClienteDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        clienteId={clienteId}
        defaultValues={defaultValues}
      />
    </div>
  )
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  if (!clienteId) {
    return <ClienteDetailPlaceholder />
  }

  return <ClienteDetailContent clienteId={clienteId} />
}
