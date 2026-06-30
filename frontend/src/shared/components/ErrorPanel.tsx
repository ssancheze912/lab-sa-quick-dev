import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorPanelProps {
  message?: string
  onRetry: () => void
}

export function ErrorPanel({ message = 'Error al cargar los datos.', onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center p-6 text-center"
      role="alert"
      aria-label="Panel de error"
    >
      <ExclamationTriangleIcon className="mb-3 h-10 w-10 text-red-400" aria-hidden="true" />
      <p className="mb-3 text-sm text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
        aria-label="Reintentar"
      >
        Reintentar
      </button>
    </div>
  )
}
