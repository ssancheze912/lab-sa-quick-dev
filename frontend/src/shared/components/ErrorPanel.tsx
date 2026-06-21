interface ErrorPanelProps {
  onRetry?: () => void;
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <svg
        className="w-12 h-12 text-red-400 mb-4"
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
      <p className="text-sm text-slate-600 mb-4">
        No fue posible cargar la información. Por favor intenta de nuevo.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-white bg-[#0e79fd] hover:bg-[#154ca9] px-4 py-2 rounded-md min-h-[44px] transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
