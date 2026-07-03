interface ErrorPanelProps {
  title?: string
  description?: string
  onRetry: () => void
}

/**
 * Shared error surface — displayed when a query rejects. Static Spanish copy
 * (NFR6): NEVER pass raw `error.message` or HTTP status. The `Reintentar`
 * button invokes the caller-supplied retry callback (usually
 * TanStack Query `refetch`).
 *
 * Uses a native `<button>` because the current `siesa-ui-kit@1.0.255` `Button`
 * does not forward arbitrary props (e.g. `data-testid`) to the underlying
 * element — the fallback rule in company-standards permits a native element
 * when the primitive cannot honour the required contract.
 */
export function ErrorPanel({
  title = 'No se pudieron cargar los datos',
  description = 'Verifica tu conexión e inténtalo de nuevo.',
  onRetry,
}: ErrorPanelProps) {
  return (
    <div
      data-testid="error-panel"
      className="flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
      <button
        type="button"
        data-testid="error-panel-retry"
        onClick={onRetry}
        className="inline-flex items-center justify-center rounded-md bg-[--color-brand-primary,#0e79fd] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-primary,#0e79fd] focus-visible:ring-offset-2"
      >
        Reintentar
      </button>
    </div>
  )
}
