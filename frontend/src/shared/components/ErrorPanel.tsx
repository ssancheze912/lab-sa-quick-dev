interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps): JSX.Element {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <p className="text-slate-500 text-sm">No se pudieron cargar los datos.</p>
      <button
        type="button"
        data-testid="retry-button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white rounded-md"
        style={{ backgroundColor: '#0e79fd' }}
      >
        Reintentar
      </button>
    </div>
  )
}
