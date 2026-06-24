import { Button } from 'siesa-ui-kit'

interface ErrorPanelProps {
  message?: string
  onRetry: () => void
}

export function ErrorPanel({
  message = 'Error al cargar los datos. Intenta de nuevo.',
  onRetry,
}: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-500"
    >
      <p className="text-sm">{message}</p>
      <Button data-testid="retry-button" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
