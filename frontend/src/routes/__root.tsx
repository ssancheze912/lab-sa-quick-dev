import { Outlet, createRootRoute } from '@tanstack/react-router'

/**
 * Root route — shell layout placeholder.
 * Subsequent stories will replace this with the NavigationRail + LayoutBase.
 */
export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div data-testid="app-root" className="min-h-screen bg-white text-slate-900">
      <Outlet />
    </div>
  )
}
