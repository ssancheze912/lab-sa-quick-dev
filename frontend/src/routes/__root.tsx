import { Outlet, createRootRoute } from '@tanstack/react-router'
import { AppShell } from '@/app/layout/AppShell'
import { NotFoundView } from '@/shared/components/NotFoundView'

/**
 * Root route — wraps every child route with the AppShell (LayoutBase + mobile
 * NavigationBar) and routes any unknown path through the in-shell `NotFoundView`.
 *
 * Story 1.2 — AC #1, #5: shell + 404 are both anchored here so the chrome stays
 * mounted across SPA navigations.
 */
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
