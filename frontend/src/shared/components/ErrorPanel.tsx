import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

export interface ErrorPanelProps {
  title?: string
  description?: string
  onRetry: () => void | Promise<void>
  isRetrying?: boolean
  'data-testid'?: string
}

/**
 * Generic error panel with a Reintentar CTA (Story 2.1).
 *
 * NFR6: this component does NOT accept an `error` prop and never renders
 * any backend payload. Copy is hardcoded in Spanish or overridden via the
 * optional `title` / `description` props, but never sourced from the network.
 *
 * Accessibility: announced assertively (`role="alert"`) so AT users hear it.
 */
export function ErrorPanel({
  title = 'No se pudo cargar la lista de clientes',
  description = 'Verifica tu conexión e intenta de nuevo.',
  onRetry,
  isRetrying = false,
  'data-testid': dataTestId = 'error-panel',
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid={dataTestId}
      className="flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <ExclamationTriangleIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600">{description}</p>
      <Button
        type="default"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? 'Reintentando...' : 'Reintentar'}
      </Button>
    </div>
  )
}
