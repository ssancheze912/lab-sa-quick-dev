import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div data-testid="app-root" className="min-h-screen bg-background">
      <Outlet />
    </div>
  ),
})
