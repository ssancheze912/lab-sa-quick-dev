/**
 * Route: /clientes
 * Story 1.2: Frontend Navigation Shell
 *
 * Placeholder view — full implementation in Epic 2.
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
    </div>
  )
}
