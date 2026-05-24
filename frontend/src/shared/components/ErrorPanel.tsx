import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorPanelProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorPanel({
  message = 'No se pudo cargar la información. Verifica tu conexión.',
  onRetry,
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center px-4 py-8 text-center"
    >
      <ExclamationTriangleIcon className="w-8 h-8 text-amber-500 mb-2" />
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
