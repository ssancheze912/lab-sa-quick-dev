import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createRootRoute({
  component: RootLayout,
  // TanStack Router's fuzzy not-found resolution renders this at the ROOT
  // level for paths that share no prefix with any route (e.g. a totally
  // unknown path never reaches the `_app` pathless layout). Render the full
  // shell here too so navigation stays visible instead of a blank page (AC5).
  notFoundComponent: RootNotFound,
})

function RootLayout() {
  return (
    <div className="min-h-svh">
      <Outlet />
    </div>
  )
}

function RootNotFound() {
  return (
    <AppShell>
      <NotFoundView />
    </AppShell>
  )
}
