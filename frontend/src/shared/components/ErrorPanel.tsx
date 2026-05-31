interface ErrorPanelProps {
  onRetry: () => void
  message?: string
}

export function ErrorPanel({ onRetry, message = 'No se pudo cargar la lista de clientes.' }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      role="alert"
      className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3"
    >
      <p className="text-slate-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-[#0e79fd] text-white text-sm font-medium hover:bg-[#154ca9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0e79fd] focus-visible:outline-offset-2 transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
