import { Outlet, createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { NotFoundView } from '@/shared/components/NotFoundView'
import { queryClient } from '@/shared/lib/queryClient'

/**
 * Root route — thin shell wrapper. Layout chrome (Navbar + NavigationRail /
 * NavigationBar) is composed one level deeper in the `_app` pathless layout.
 * The TanStack Query provider lives here so any route (production or under
 * test) that renders through the router has a client available.
 */
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div data-testid="app-root" className="min-h-full">
        <Outlet />
      </div>
    </QueryClientProvider>
  )
}
