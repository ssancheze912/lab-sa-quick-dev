// ErrorPanel — custom component (siesa-ui-kit has no equivalent)
// Decision logged: checked siesa-ui-kit catalog, no ErrorPanel component found.

interface ErrorPanelProps {
  onRetry: () => void
  message?: string
}

export function ErrorPanel({ onRetry, message }: ErrorPanelProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full px-4 py-8 text-center"
      data-testid="error-panel"
    >
      <div className="text-red-400 mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-sm text-slate-600">
        {message ?? 'No se pudieron cargar los datos'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  )
}
