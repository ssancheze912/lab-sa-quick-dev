import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorPanelProps {
  onRetry: () => void;
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      role="alert"
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-3" aria-hidden="true" />
      <p className="text-slate-600 text-sm mb-4">No se pudo cargar la información</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  );
}
