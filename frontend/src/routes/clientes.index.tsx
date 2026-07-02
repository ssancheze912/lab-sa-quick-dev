import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clientes/')({ component: ClientesIndex })

/**
 * Renders the placeholder inside the right panel when the URL is exactly
 * /clientes. Hidden on mobile — the list occupies the full viewport there.
 */
function ClientesIndex() {
  return (
    <div
      data-testid="cliente-detail-empty"
      className="hidden flex-1 items-center justify-center text-slate-400 lg:flex"
    >
      Selecciona un cliente para ver el detalle
    </div>
  )
}
