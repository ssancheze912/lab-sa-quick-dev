interface ErrorPanelProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorPanel({
  onRetry,
  message = 'No se pudo cargar la lista. Intenta de nuevo.',
}: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <p className="text-slate-500 text-sm mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-[#0e79fd] text-white text-sm font-medium rounded-md hover:bg-[#154ca9] transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
