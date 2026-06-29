interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="clientes-error-panel"
      className="flex flex-col items-center justify-center p-8 text-center gap-4"
    >
      <p className="text-slate-600 text-sm">
        No se pudo cargar la información. Por favor, intente nuevamente.
      </p>
      <button
        data-testid="clientes-retry-button"
        onClick={onRetry}
        className="px-4 py-2 bg-[#0e79fd] text-white text-sm rounded hover:bg-[#154ca9] transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
