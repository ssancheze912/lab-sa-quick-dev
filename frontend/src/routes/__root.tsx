import { Outlet, createRootRoute } from '@tanstack/react-router'
import { NotFoundView } from '@/shared/components/NotFoundView'

/**
 * Root route — thin shell wrapper. Layout chrome (Navbar + NavigationRail /
 * NavigationBar) is composed one level deeper in the `_app` pathless layout.
 * Global not-found fallback is registered here for any route that escapes
 * the `_app` layout.
 */
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <div data-testid="app-root" className="min-h-full">
      <Outlet />
    </div>
  )
}
