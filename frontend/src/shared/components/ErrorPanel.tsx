interface ErrorPanelProps {
  message?: string
  onRetry?: () => void
}

export function ErrorPanel({ onRetry }: ErrorPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <p className="text-slate-600 text-sm mb-4">No se pudo cargar la información.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-white rounded-md"
          style={{ backgroundColor: '#0e79fd' }}
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
