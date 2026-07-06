import { Button } from 'siesa-ui-kit'

interface ErrorPanelProps {
  message: string
  onRetry: () => void
}

/**
 * Never render `error.message`/raw exception text (NFR6) — only the fixed,
 * safe `message` string passed in by the caller.
 */
export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <p className="text-sm font-medium text-slate-900 dark:text-white">{message}</p>
      <Button type="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
