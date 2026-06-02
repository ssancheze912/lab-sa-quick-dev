import { Link } from '@tanstack/react-router'

/**
 * Spanish 404 view rendered inside the AppShell layout via the root route's
 * `notFoundComponent` (Story 1.2 — AC #5 / TC-E1-P1-04).
 *
 * Keeps the user inside the shell (no full page reload) and offers a SPA link
 * back to `/clientes` styled with the brand primary color.
 */
export function NotFoundView() {
  return (
    <section
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <h1 className="text-3xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-600">La ruta solicitada no existe.</p>
      <Link
        to="/clientes"
        className="inline-flex items-center rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        Ir a Clientes
      </Link>
    </section>
  )
}
