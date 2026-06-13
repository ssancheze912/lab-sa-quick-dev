interface ErrorPanelProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorPanel({
  onRetry,
  message = 'No se pudo cargar la información. Intenta de nuevo.',
}: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center"
    >
      <p className="text-slate-500 text-sm">{message}</p>
      <button
        type="button"
        data-testid="error-panel-retry-button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
