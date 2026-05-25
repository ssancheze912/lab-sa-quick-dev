import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorPanelProps {
  onRetry: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center h-full px-4 py-8 text-center"
    >
      <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-600 mb-4">
        No se pudo cargar la información
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  )
}
