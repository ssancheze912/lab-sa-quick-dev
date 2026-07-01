import { Button } from 'siesa-ui-kit'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorPanelProps {
  onRetry: () => void
}

/**
 * Never renders the raw error message — only a fixed, user-facing copy —
 * per architecture's error-handling rule (no technical detail leak, NFR6).
 */
export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div data-testid="error-panel" className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <ExclamationTriangleIcon className="h-10 w-10 text-red-500" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-900">No se pudo cargar la información</p>
      <p className="text-sm text-slate-600">Ocurrió un error al conectar con el servidor.</p>
      <Button type="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
