interface ErrorPanelProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorPanel({ onRetry, message = 'No se pudieron cargar los clientes.' }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="w-10 h-10 mb-3 text-red-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <p className="text-sm text-slate-600 mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  );
}
