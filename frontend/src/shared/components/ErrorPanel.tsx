import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorPanelProps {
  title: string
  description?: string
  onRetry: () => void
  testId?: string
}

/**
 * Spanish-content error panel with a primary "Reintentar" button.
 * Callers MUST supply the Spanish copy.
 */
export function ErrorPanel({
  title,
  description,
  onRetry,
  testId,
}: ErrorPanelProps) {
  return (
    <div
      data-testid={testId}
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center"
    >
      <ExclamationTriangleIcon
        className="h-10 w-10 text-red-500"
        aria-hidden="true"
      />
      <h3 className="text-base font-medium text-slate-900">{title}</h3>
      {description ? (
        <p className="text-sm text-slate-500">{description}</p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40"
      >
        Reintentar
      </button>
    </div>
  )
}
