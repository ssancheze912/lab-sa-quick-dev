import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NotFound } from './not-found'

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
})
