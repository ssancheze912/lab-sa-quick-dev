/**
 * Story 1.2 — Task 1 & 4
 *
 * Root route: renders the persistent AppShell around an <Outlet />, and
 * registers the NotFoundView for any unknown path (rendered inside the shell
 * so the navigation remains visible — AC #4).
 */
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <NotFoundView />
    </AppShell>
  ),
})
