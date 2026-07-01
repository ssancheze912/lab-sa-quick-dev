import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
  notFoundComponent: NotFoundView,
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
