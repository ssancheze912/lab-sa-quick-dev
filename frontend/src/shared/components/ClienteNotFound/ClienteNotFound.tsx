import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

/**
 * Story 2.2 — Graceful not-found state for the client detail view.
 *
 * NFR6 contract identical to {@link ErrorPanel}: this component receives ONLY
 * `onBackToList`. No error object, no id, no HTTP detail. By construction it
 * cannot leak technical detail.
 */
export interface ClienteNotFoundProps {
  onBackToList: () => void
}

export function ClienteNotFound({ onBackToList }: ClienteNotFoundProps): React.ReactElement {
  return (
    <section
      data-testid="cliente-not-found"
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <ExclamationCircleIcon className="h-12 w-12 text-slate-400" aria-hidden="true" />
      <h2 className="text-base font-medium text-slate-900">Cliente no encontrado</h2>
      <p className="text-sm text-muted-foreground">
        El cliente que buscas no existe o fue eliminado
      </p>
      <Button type="outline" onClick={onBackToList}>
        Volver a la lista
      </Button>
    </section>
  )
}
