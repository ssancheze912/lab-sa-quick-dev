import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorPanelProps {
  message: string
  onRetry: () => void
}

export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center h-full p-6 text-center"
    >
      <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-3" aria-hidden="true" />
      <p className="text-sm text-slate-600 mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  )
}
