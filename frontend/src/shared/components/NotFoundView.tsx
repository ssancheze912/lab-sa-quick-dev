import { Link } from '@tanstack/react-router'
import { Button } from 'siesa-ui-kit'
import { AppShell } from './AppShell'

/**
 * 404 message body — no shell chrome. Use this inside a route that already
 * renders `AppShell` (e.g. `_app.notFoundComponent`) to avoid a duplicate shell.
 */
export function NotFoundContent() {
  return (
    <section
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 className="text-3xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-600">La página solicitada no existe.</p>
      <Link to="/clientes" className="inline-block">
        <Button type="default" color="primary">
          Ir a Clientes
        </Button>
      </Link>
    </section>
  )
}

/**
 * Global 404 fallback rendered by the router when a route cannot be resolved.
 * Wraps `NotFoundContent` with the persistent `AppShell` so the shell remains
 * visible even when the unknown route falls outside the `_app` layout.
 */
export function NotFoundView() {
  return (
    <AppShell>
      <NotFoundContent />
    </AppShell>
  )
}
