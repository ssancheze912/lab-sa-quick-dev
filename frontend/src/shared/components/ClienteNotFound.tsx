import { Button } from 'siesa-ui-kit'
import { UserGroupIcon } from '@heroicons/react/24/outline'

export interface ClienteNotFoundProps {
  onBackToList: () => void
}

/**
 * Not-found panel for the client detail view (Story 2.2, AC #3 / #4).
 *
 * - Uses role="status" + aria-live="polite" (routine "no data" state — NOT
 *   role="alert", which is reserved for errors like ErrorPanel).
 * - The Spanish copy is load-bearing: tests assert the exact strings.
 * - Does NOT know about useNavigate — the parent wires the callback so the
 *   component stays pure and testable without a router provider.
 */
export function ClienteNotFound({ onBackToList }: ClienteNotFoundProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <UserGroupIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-slate-900">Cliente no encontrado</h2>
      <p className="text-sm text-slate-600">
        El cliente que buscas no existe o fue eliminado.
      </p>
      <Button type="outline" onClick={onBackToList}>
        Volver a la lista
      </Button>
    </div>
  )
}
