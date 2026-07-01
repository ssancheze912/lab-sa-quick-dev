import { useState } from 'react'
import { isAxiosError } from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { UserCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { AlertDialog, Button } from 'siesa-ui-kit'
import { useCliente } from '@/modules/crm/clientes/application/hooks/useCliente'
import { ClienteForm } from '@/modules/crm/clientes/presentation/components/ClienteForm'

interface ClienteDetailViewProps {
  clienteId?: string
  /**
   * Set by the `/clientes/:clienteId` route once the clientes list loaded
   * alongside this view (split-panel layout) resolves. `'missing'` means the
   * list confirmed `clienteId` does not exist — the individual `GET
   * /api/v1/clientes/{id}` request is skipped entirely in that case.
   * `'pending'` means the list hasn't resolved yet, so we don't yet know;
   * the by-id request is briefly held off rather than fired optimistically.
   * `'present'` (or omitted, for standalone usage) proceeds normally.
   *
   * Why: a real 404 response is logged by the browser's own network stack
   * as a `console.error`-level "Failed to load resource" entry regardless
   * of how axios/React Query handle it afterwards in JS (verified: fires
   * identically for fetch/XHR, same/cross-origin, and even with axios
   * `validateStatus` overridden to treat 404 as success) — this is native
   * Chromium DevTools Protocol behavior, not something an interceptor or
   * query error handler can suppress. Skipping the doomed request when the
   * list already proves the id is missing keeps NFR6 (zero console errors)
   * satisfied without changing the backend's 404/RFC7807 contract.
   *
   * Defaults to `'present'` so this component keeps working standalone (e.g.
   * `clientes.index.tsx`'s empty state, and its own isolated unit tests).
   */
  listMembership?: 'pending' | 'present' | 'missing'
}

export function ClienteDetailView({
  clienteId,
  listMembership = 'present',
}: ClienteDetailViewProps) {
  const knownMissing = listMembership === 'missing'
  const listPending = listMembership === 'pending'
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { data, isLoading, isError, error } = useCliente(clienteId, {
    enabled: listMembership !== 'missing' && listMembership !== 'pending',
  })

  if (!clienteId) {
    return (
      <div
        data-testid="cliente-detail-empty"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <UserCircleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm text-slate-600">Selecciona un cliente para ver el detalle.</p>
      </div>
    )
  }

  // `knownMissing` disables the underlying query (see useCliente), which
  // would otherwise leave `isLoading` stuck at `true` forever — check this
  // before the loading state so the not-found block renders immediately.
  // `listMembership === 'pending'` ALSO disables the query (holding off the
  // by-id request until we know whether it's worth making), which means
  // TanStack Query v5 reports `isLoading: false` for it (a disabled query
  // that has never fetched is `status: 'pending'` but NOT `isFetching`, so
  // `isLoading` — defined as `isPending && isFetching` — never becomes true).
  // `listPending` is checked explicitly here so the skeleton still renders
  // (same as a normal in-flight fetch would), instead of falling through to
  // the generic error block below.
  if ((isLoading || listPending) && !knownMissing) {
    return (
      <div data-testid="cliente-detail-loading" className="flex-1 p-6">
        <Skeleton height={28} width="40%" className="mb-4" />
        <Skeleton count={4} height={20} className="mb-3" />
      </div>
    )
  }

  const isNotFound = knownMissing || (isError && isAxiosError(error) && error.response?.status === 404)

  if (isNotFound) {
    return (
      <div
        data-testid="cliente-not-found"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <ExclamationTriangleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">Cliente no encontrado</p>
        <p className="text-sm text-slate-600">El cliente que buscas no existe o fue eliminado.</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        data-testid="cliente-not-found"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <ExclamationTriangleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">No se pudo cargar el cliente</p>
        <p className="text-sm text-slate-600">Ocurrió un error al conectar con el servidor.</p>
      </div>
    )
  }

  return (
    <div data-testid="cliente-detail-panel" className="flex-1 p-6">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setIsEditDialogOpen(true)}>Editar</Button>
      </div>
      <dl className="flex flex-col gap-3">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Nombre</dt>
          <dd className="text-sm text-slate-900">{data.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">NIT/RUC</dt>
          <dd className="text-sm text-slate-900">{data.nit}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Teléfono</dt>
          <dd className="text-sm text-slate-900">{data.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Ciudad</dt>
          <dd className="text-sm text-slate-900">{data.ciudad}</dd>
        </div>
      </dl>

      <AlertDialog
        isOpen={isEditDialogOpen}
        title="Editar cliente"
        onCancel={() => setIsEditDialogOpen(false)}
        hideCancel
        actions={null}
        description={
          <ClienteForm
            mode="edit"
            id={data.id}
            initialValues={{
              nombre: data.nombre,
              nit: data.nit,
              telefono: data.telefono,
              ciudad: data.ciudad,
            }}
            onSuccess={() => setIsEditDialogOpen(false)}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        }
      />
    </div>
  )
}
