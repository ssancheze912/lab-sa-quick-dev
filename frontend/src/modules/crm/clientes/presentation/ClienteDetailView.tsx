import { useState } from 'react'
import { Button } from 'siesa-ui-kit'
import { useCliente } from '@/modules/crm/clientes/application/useCliente'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { ClienteForm } from '@/modules/crm/clientes/presentation/ClienteForm'

interface ClienteDetailViewProps {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isError, isSuccess, refetch } = useCliente(clienteId)
  const [isEditOpen, setIsEditOpen] = useState(false)

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

          <div className="mt-4">
            <Button htmlType="button" size="sm" onClick={() => setIsEditOpen(true)}>
              Editar
            </Button>
          </div>

          <ClienteForm open={isEditOpen} onOpenChange={setIsEditOpen} cliente={data} />
        </>
      )}
    </div>
  )
}
