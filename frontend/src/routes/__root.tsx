import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryProvider } from '../app/providers/QueryProvider'

export const Route = createRootRoute({
  component: () => (
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  ),
})
