/**
 * Route: /contactos
 * Story 1.2: Frontend Navigation Shell
 *
 * Placeholder view — full implementation in Epic 3.
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Contactos</h1>
    </div>
  )
}
