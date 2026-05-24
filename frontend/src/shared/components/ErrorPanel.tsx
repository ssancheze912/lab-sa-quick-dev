// Story 2.1: Client List & Search
// Shared component: ErrorPanel

interface ErrorPanelProps {
  onRetry: () => void
  message?: string
}

export function ErrorPanel({ onRetry, message }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center h-full gap-3 px-4 py-8 text-center"
    >
      <p className="text-sm text-slate-500">
        {message ?? 'No se pudo cargar la información.'}
      </p>
      <button
        onClick={onRetry}
        aria-label="Reintentar carga"
        className="bg-[#0e79fd] text-white px-4 py-2 rounded-md text-sm hover:bg-[#0c6de0] transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
