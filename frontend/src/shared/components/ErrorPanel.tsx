interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="error-panel"
    >
      <svg
        aria-hidden="true"
        className="w-12 h-12 text-red-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <p className="text-slate-700 text-sm mb-4">
        No se pudo cargar la información. Por favor, intenta nuevamente.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-[#0e79fd] text-white text-sm font-medium rounded hover:bg-[#154ca9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0e79fd] transition-colors"
        data-testid="retry-button"
      >
        Reintentar
      </button>
    </div>
  )
}
