import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
  // TanStack Router's default `notFoundMode: 'fuzzy'` resolves a not-found state
  // at the NEAREST matched ancestor route, not always the root. A nested unknown
  // path that shares a prefix with a real route (e.g. "/clientes/no-existe")
  // matches into this pathless `_app` layout branch, so without a notFoundComponent
  // registered here it fell back to TanStack's plain-text default instead of the
  // Spanish `NotFoundView` (AC5 violation for nested unknown routes). Registering
  // it here mirrors the root route's registration (which only covers *fully*
  // unmatched paths) so both cases render the same graceful, Spanish 404 UX.
  // AppLayout already wraps <Outlet /> in <AppShell>, so the nav stays visible.
  notFoundComponent: NotFoundView,
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
