import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

/**
 * Story 2.1 — Load-time error surface.
 *
 * NFR6: the component intentionally accepts ONLY an `onRetry` callback; the
 * underlying error object never reaches the UI, so technical details (status
 * codes, URLs, RFC 7807 fields) cannot leak.
 */
export interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps): React.ReactElement {
  return (
    <div
      data-testid="error-panel"
      role="alert"
      className="flex flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <ExclamationTriangleIcon className="h-12 w-12 text-amber-500" aria-hidden="true" />
      <h2 className="text-base font-medium text-slate-900">No pudimos cargar los clientes</h2>
      <p className="text-sm text-muted-foreground">
        Verifica tu conexión e intenta nuevamente
      </p>
      <Button onClick={onRetry}>Reintentar</Button>
    </div>
  )
}
