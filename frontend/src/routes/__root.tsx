import { Outlet, createRootRoute } from '@tanstack/react-router'

/**
 * Root route — the layout shell placeholder for the SPA. Additional layout
 * chrome (nav, breadcrumbs, sidebar) is introduced in later foundation stories.
 */
export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div data-testid="app-root" className="min-h-full">
      <Outlet />
    </div>
  )
}
