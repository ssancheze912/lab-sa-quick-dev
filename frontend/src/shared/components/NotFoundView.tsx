import { Link } from '@tanstack/react-router'

/**
 * Vista de 404 en español que se muestra cuando la ruta solicitada no existe.
 * Debe montarse dentro del shell (Navbar + rail/nav) — es decir, el shell la rodea
 * naturalmente ya que se registra como `notFoundComponent` del root route.
 */
export function NotFoundView() {
  return (
    <section
      data-testid="not-found-view"
      aria-live="polite"
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        Página no encontrada
      </h1>
      <p className="max-w-md text-slate-600 dark:text-slate-300">
        La ruta solicitada no existe. Verifica la URL o vuelve a la lista de clientes.
      </p>
      <Link
        to="/clientes"
        className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors motion-safe:duration-150 hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Ir a Clientes
      </Link>
    </section>
  )
}
