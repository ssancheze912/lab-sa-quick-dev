interface ErrorPanelProps {
  onRetry: () => void
  'aria-label'?: string
}

export function ErrorPanel({ onRetry, 'aria-label': ariaLabel }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      aria-label={ariaLabel}
      className="flex flex-col items-center justify-center py-12 text-slate-600"
    >
      <p className="text-sm mb-4">Ocurrió un error al cargar los datos.</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-3 rounded text-sm min-h-[44px] hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  )
}
