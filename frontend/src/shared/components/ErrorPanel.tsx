interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      role="alert"
      className="flex flex-col items-center justify-center p-6 text-center"
    >
      <p className="text-slate-600 text-sm mb-4">
        No se pudo cargar la información. Verifica tu conexión.
      </p>
      <button
        data-testid="retry-button"
        onClick={onRetry}
        className="px-4 py-2 bg-[#0e79fd] text-white text-sm rounded hover:bg-[#154ca9] transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
