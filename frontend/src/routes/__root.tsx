import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NotFoundPage } from './-not-found'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <div id="app-shell">
      <Outlet />
    </div>
  )
}
