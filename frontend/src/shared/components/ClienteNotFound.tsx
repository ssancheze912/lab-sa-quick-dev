import { Link } from '@tanstack/react-router'

/**
 * Not-found panel for the Cliente Detail view (Story 2.2 AC #3).
 * Rendered when `useCliente()` resolves with `isError` + HTTP 404. Sibling of
 * <EmptyState /> / <ErrorPanel /> — placeholder-simple, all Spanish copy, and
 * exposes a link back to /clientes so the user is never trapped.
 */
export function ClienteNotFound() {
  return (
    <div
      data-testid="cliente-not-found"
      className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <p className="text-sm font-medium text-slate-700">
        No se encontró el cliente solicitado.
      </p>
      <p className="text-xs text-slate-500">
        Es posible que haya sido eliminado o que el enlace sea incorrecto.
      </p>
      <Link
        to="/clientes"
        data-testid="cliente-not-found-back"
        className="text-sm text-[--color-brand-primary,#0e79fd] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-primary,#0e79fd]"
      >
        Volver a la lista
      </Link>
    </div>
  )
}
