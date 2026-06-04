import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ErrorPanelProps {
  onRetry: () => void;
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center"
    >
      <ExclamationCircleIcon className="h-12 w-12 text-red-500" aria-hidden="true" />
      <p className="text-sm text-slate-700">
        No se pudo cargar la información. Por favor intenta nuevamente.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
        aria-label="Reintentar carga de datos"
      >
        Reintentar
      </button>
    </div>
  );
}
