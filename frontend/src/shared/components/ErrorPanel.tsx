interface ErrorPanelProps {
  onRetry: () => void
  testId?: string
  retryTestId?: string
  message?: string
}

export function ErrorPanel({
  onRetry,
  testId = 'error-panel',
  retryTestId = 'retry-button',
  message = 'No se pudo cargar la información. Por favor, intente nuevamente.',
}: ErrorPanelProps) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center p-8 text-center gap-4"
    >
      <p className="text-slate-600 text-sm">{message}</p>
      <button
        data-testid={retryTestId}
        onClick={onRetry}
        className="px-4 py-2 bg-[#0e79fd] text-white text-sm rounded hover:bg-[#154ca9] transition-colors"
        type="button"
      >
        Reintentar
      </button>
    </div>
  )
}
