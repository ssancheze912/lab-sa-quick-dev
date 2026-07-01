import { isAxiosError } from 'axios'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { UserCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useContacto } from '@/modules/crm/contactos/application/hooks/useContacto'

interface ContactoDetailViewProps {
  contactoId?: string
  /**
   * Set by the `/contactos/:contactoId` route once the contactos list loaded
   * alongside this view (split-panel layout) resolves. `'missing'` means the
   * list confirmed `contactoId` does not exist — the individual `GET
   * /api/v1/contactos/{id}` request is skipped entirely in that case.
   * `'pending'` means the list hasn't resolved yet, so we don't yet know;
   * the by-id request is briefly held off rather than fired optimistically.
   * `'present'` (or omitted, for standalone usage) proceeds normally.
   *
   * Mirrors `ClienteDetailView`'s exact pattern (Story 2.2) — see that
   * component's doc comment for why this is required for AC #3/NFR6 (zero
   * console errors), not optional polish.
   *
   * Defaults to `'present'` so this component keeps working standalone (e.g.
   * `contactos.index.tsx`'s empty state, and its own isolated unit tests).
   */
  listMembership?: 'pending' | 'present' | 'missing'
}

export function ContactoDetailView({
  contactoId,
  listMembership = 'present',
}: ContactoDetailViewProps) {
  const knownMissing = listMembership === 'missing'
  const listPending = listMembership === 'pending'
  const { data, isLoading, isError, error } = useContacto(contactoId, {
    enabled: listMembership !== 'missing' && listMembership !== 'pending',
  })

  if (!contactoId) {
    return (
      <div
        data-testid="contacto-detail-empty"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <UserCircleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm text-slate-600">Selecciona un contacto para ver el detalle.</p>
      </div>
    )
  }

  // See ClienteDetailView for the reasoning behind checking `listPending`
  // before `isLoading`: a disabled query never becomes `isLoading: true`, so
  // the skeleton must be rendered explicitly for the 'pending' membership
  // state instead of falling through to the not-found/error blocks below.
  if ((isLoading || listPending) && !knownMissing) {
    return (
      <div data-testid="contacto-detail-loading" className="flex-1 p-6">
        <Skeleton height={28} width="40%" className="mb-4" />
        <Skeleton count={4} height={20} className="mb-3" />
      </div>
    )
  }

  const isNotFound = knownMissing || (isError && isAxiosError(error) && error.response?.status === 404)

  if (isNotFound) {
    return (
      <div
        data-testid="contacto-not-found"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <ExclamationTriangleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">Contacto no encontrado</p>
        <p className="text-sm text-slate-600">El contacto que buscas no existe o fue eliminado.</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        data-testid="contacto-not-found"
        className="flex h-full flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <ExclamationTriangleIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">No se pudo cargar el contacto</p>
        <p className="text-sm text-slate-600">Ocurrió un error al conectar con el servidor.</p>
      </div>
    )
  }

  return (
    <div data-testid="contacto-detail-panel" className="flex-1 p-6">
      <dl className="flex flex-col gap-3">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Nombre</dt>
          <dd className="text-sm text-slate-900">{data.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Cargo</dt>
          <dd className="text-sm text-slate-900">{data.cargo}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Teléfono</dt>
          <dd className="text-sm text-slate-900">{data.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Email</dt>
          <dd className="text-sm text-slate-900">{data.email}</dd>
        </div>
      </dl>
    </div>
  )
}
