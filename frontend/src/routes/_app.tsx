import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'
import { NotFoundContent } from '@/shared/components/NotFoundView'

/**
 * Pathless authenticated layout route. Renders the persistent `AppShell`
 * (Navbar + NavigationRail on desktop, NavigationBar on mobile) around the
 * matched child route via `<Outlet />`. The 404 `notFoundComponent` is set
 * here so the shell stays mounted when an unknown route is requested.
 * `NotFoundContent` renders without a shell wrapper since this route already
 * mounts the `AppShell`.
 */
export const Route = createFileRoute('/_app')({
  component: AppLayout,
  notFoundComponent: NotFoundContent,
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
