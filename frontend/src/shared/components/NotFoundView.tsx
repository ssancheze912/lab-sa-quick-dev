/**
 * Story 1.2 — Task 4
 *
 * 404 view rendered by the root route's `notFoundComponent` for any unknown
 * path. Spanish copy per company-standards (Frontend Key Rules → user-facing
 * text in Spanish). Consumed by TC-E1-P1-04 and the Vitest notFound.test.tsx.
 */
import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <section data-testid="not-found-view" className="flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <p className="text-slate-600">La ruta que intentas abrir no existe.</p>
      <Link
        to="/clientes"
        className="rounded-md bg-[#0e79fd] px-4 py-2 text-white hover:bg-[#154ca9]"
      >
        Ir a Clientes
      </Link>
    </section>
  )
}
