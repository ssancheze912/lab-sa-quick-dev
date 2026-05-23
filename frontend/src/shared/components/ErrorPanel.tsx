interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      role="alert"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">
        No se pudo cargar la información. Por favor, inténtalo de nuevo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  )
}
