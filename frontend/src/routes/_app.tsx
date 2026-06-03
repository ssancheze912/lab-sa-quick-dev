import { createFileRoute, Outlet } from '@tanstack/react-router'
import { QueryProvider } from '../app/providers/QueryProvider'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  )
}
