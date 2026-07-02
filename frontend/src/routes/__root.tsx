import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div data-testid="app-root" className="min-h-screen">
      <Outlet />
    </div>
  )
}
