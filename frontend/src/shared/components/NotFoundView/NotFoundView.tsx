import { Button } from 'siesa-ui-kit'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useNavigate } from '@tanstack/react-router'

/**
 * NotFoundView — 404 page rendered by the TanStack Router `notFoundComponent`
 * on the root route. Rendered inside the AppShell so the nav remains functional.
 */
export function NotFoundView() {
  const navigate = useNavigate()

  return (
    <section
      data-testid="not-found-view"
      role="alert"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <ExclamationTriangleIcon
        className="size-9 text-amber-500"
        aria-hidden="true"
      />
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="max-w-md text-slate-600">
        La ruta solicitada no existe. Verifica la URL o vuelve al inicio.
      </p>
      <Button
        color="primary"
        type="default"
        onClick={() => navigate({ to: '/clientes' })}
      >
        Ir a Clientes
      </Button>
    </section>
  )
}
