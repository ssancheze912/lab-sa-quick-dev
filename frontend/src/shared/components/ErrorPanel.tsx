interface ErrorPanelProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorPanel({ message = 'Error al cargar los clientes', onRetry }: ErrorPanelProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
