import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ErrorPanelProps {
  onRetry: () => void;
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500"
    >
      <ExclamationCircleIcon className="w-12 h-12 mb-3 text-red-400" />
      <p className="text-sm mb-4">No se pudo cargar la información.</p>
      <button
        data-testid="retry-button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
      >
        Reintentar
      </button>
    </div>
  );
}
