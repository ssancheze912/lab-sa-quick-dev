import { Outlet, createRootRoute } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  // Render the shell immediately while initial route matches are being
  // resolved so navigation chrome is always present (FR28/FR29).
  pendingComponent: () => (
    <AppShell>
      <div />
    </AppShell>
  ),
})

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function NotFoundComponent() {
  // The root component already provides AppShell around <Outlet />.
  // The not-found component is rendered in place of the matched child route,
  // so the shell (rail/bar) remains visible.
  return <NotFoundView />
}
