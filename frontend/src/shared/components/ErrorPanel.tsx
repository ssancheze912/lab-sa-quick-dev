interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 px-4 py-8 text-center"
      role="alert"
    >
      <svg
        className="w-10 h-10 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="text-sm text-slate-600">
        No se pudo cargar la lista de clientes.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  )
}
