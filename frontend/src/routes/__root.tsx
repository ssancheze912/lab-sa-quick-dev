import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../shared/lib/queryClient'
import { NotFoundView } from '../shared/components/NotFoundView'
import { ToastContainer } from '../shared/components/ToastContainer'
import 'siesa-ui-kit/styles.css'

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ToastContainer />
    </QueryClientProvider>
  ),
  notFoundComponent: NotFoundView,
})
