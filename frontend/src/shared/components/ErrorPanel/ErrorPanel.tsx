import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

export interface ErrorPanelProps {
  title?: string
  message?: string
  onRetry: () => void
  testId?: string
}

/**
 * Generic error panel with a Reintentar action. Used wherever a failed fetch
 * should not silently swallow the error and the user needs a manual retry.
 */
export function ErrorPanel({
  title = 'No se pudo cargar',
  message = 'Verifica tu conexión e intenta de nuevo.',
  onRetry,
  testId = 'error-panel',
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      data-testid={testId}
      className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
        <ExclamationTriangleIcon
          className="size-10 text-red-600"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{message}</p>
      <div className="mt-2">
        <Button type="default" size="base" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    </div>
  )
}
