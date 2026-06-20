interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-600"
      data-testid="cliente-error-panel"
    >
      <p className="text-sm">No se pudo cargar la lista. Verifica tu conexión.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        data-testid="cliente-retry-button"
      >
        Reintentar
      </button>
    </div>
  )
}
