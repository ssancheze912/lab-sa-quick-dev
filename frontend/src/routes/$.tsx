/**
 * Catch-all 404 route
 * Story 1.2: Frontend Navigation Shell
 *
 * AC5: Unknown routes render a friendly 404 view with a link back to /clientes.
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFoundView,
})

function NotFoundView() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 p-6"
      data-testid="not-found-view"
    >
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta solicitada no existe.</p>
      <a
        href="/clientes"
        className="text-[#0e79fd] underline hover:text-[#154ca9]"
        data-testid="not-found-back-link"
      >
        Ir a Clientes
      </a>
    </div>
  )
}
