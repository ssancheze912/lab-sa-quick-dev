import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <div data-testid="app-root">
      <Outlet />
    </div>
  )
}
