import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NotFoundView } from '../shared/components/NotFoundView'

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundView,
})
