import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface ErrorPanelProps {
  message?: string
  onRetry?: () => void
}

export function ErrorPanel({
  message = 'No se pudo cargar la información',
  onRetry,
}: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <ExclamationCircleIcon
        className="w-10 h-10 text-red-400"
        aria-hidden="true"
      />
      <p className="text-sm text-slate-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-lg hover:bg-[#154ca9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
