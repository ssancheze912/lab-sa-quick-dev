interface ErrorPanelProps {
  onRetry: () => void
  message?: string
}

export function ErrorPanel({ onRetry, message }: ErrorPanelProps) {
  const displayMessage = message ?? 'No se pudo cargar la información'

  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center h-full py-10 px-4 text-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-12 h-12 text-red-400 mb-4"
        aria-hidden="true"
      >
        {/* Heroicons ExclamationCircleIcon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
      <p className="text-sm font-semibold text-slate-700 mb-4">{displayMessage}</p>
      <button
        type="button"
        data-testid="retry-button"
        aria-label="Reintentar carga"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-lg hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2 transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
