import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorPanelProps {
  title?: string
  onRetry: () => void
  testId?: string
  retryTestId?: string
}

/**
 * Error placeholder with a Reintentar action — Story 2.1 AC #5.
 *
 * NEVER renders `error.message` — the copy is fixed Spanish text so backend
 * stack traces / raw errors don't leak to the UI (NFR6). Uses `role="alert"`
 * so screen readers announce the failure immediately.
 */
export function ErrorPanel({
  title = 'No pudimos cargar la lista de clientes.',
  onRetry,
  testId,
  retryTestId,
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      data-testid={testId ?? 'error-panel'}
      className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center"
    >
      <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <button
        type="button"
        onClick={onRetry}
        data-testid={retryTestId ?? 'error-panel-retry'}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110"
      >
        Reintentar
      </button>
    </div>
  )
}
