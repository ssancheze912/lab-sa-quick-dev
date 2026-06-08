import { Button } from 'siesa-ui-kit'

/**
 * Story 2.1: ErrorPanel shared component
 *
 * AC #8 — Rendered in place of the list/empty-state when the initial fetch
 * fails. Clicking "Reintentar" invokes `onRetry`, which the parent wires to
 * TanStack Query's `refetch()` (no full page reload).
 *
 * AC #11 — `role="alert"` so screen readers announce the error.
 */
interface ErrorPanelProps {
  onRetry: () => void
  title?: string
  message?: string
}

const DEFAULT_TITLE = 'No se pudo cargar'
const DEFAULT_MESSAGE = 'Ocurrió un problema al cargar los clientes. Intenta de nuevo.'

export function ErrorPanel({
  onRetry,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
}: ErrorPanelProps) {
  return (
    <section
      role="alert"
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500">{message}</p>
      <Button onClick={onRetry}>Reintentar</Button>
    </section>
  )
}
