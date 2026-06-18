import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { NotFoundPage } from '../shared/components/NotFoundPage'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <div id="single-spa-application">
      <Outlet />
      <Toaster position="bottom-right" />
    </div>
  )
}
