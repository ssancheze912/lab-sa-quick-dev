import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ErrorPanelProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorPanel({ onRetry, message = 'No se pudo cargar la información.' }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400"
    >
      <ExclamationCircleIcon className="h-12 w-12 text-red-400" aria-hidden="true" />
      <p className="text-sm text-center">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  );
}
