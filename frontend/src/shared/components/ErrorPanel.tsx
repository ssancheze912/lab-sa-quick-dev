interface ErrorPanelProps {
  message?: string
  onRetry: () => void
}

export function ErrorPanel({ message = 'Error al cargar los datos.', onRetry }: ErrorPanelProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-6 text-center"
      role="alert"
      aria-label="Panel de error"
    >
      <svg
        className="mb-3 h-10 w-10 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <p className="mb-3 text-sm text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
        aria-label="Reintentar"
      >
        Reintentar
      </button>
    </div>
  )
}
