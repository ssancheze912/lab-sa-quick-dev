import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorPanelProps {
  onRetry: () => void;
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-4 py-12 px-4 text-center"
      role="alert"
    >
      <ExclamationTriangleIcon
        className="h-12 w-12 text-red-400"
        aria-hidden="true"
      />
      <p className="text-sm text-slate-600">
        Ocurrió un error al cargar los datos.
      </p>
      <button
        data-testid="error-panel-retry-button"
        type="button"
        onClick={onRetry}
        className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  );
}
