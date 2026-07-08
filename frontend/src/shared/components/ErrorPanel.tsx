import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'

export interface ErrorPanelProps {
  title: string
  subtitle?: string
  onRetry: () => void
  isRetrying?: boolean
}

/**
 * Presentational error panel with a Spanish retry button (Story 2.1).
 * NEVER receives the raw error object — the parent decides the copy (NFR6).
 */
export function ErrorPanel({ title, subtitle, onRetry, isRetrying = false }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 p-6 text-center"
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="h-10 w-10 text-slate-400"
      />
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      <div className="pt-2">
        <Button type="outline" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? (
            <span className="inline-flex items-center gap-2">
              <ArrowPathIcon
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
              Reintentar
            </span>
          ) : (
            'Reintentar'
          )}
        </Button>
      </div>
    </div>
  )
}
