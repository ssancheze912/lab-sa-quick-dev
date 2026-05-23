import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NavigationShell } from '../shared/components/NavigationShell'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <NavigationShell />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
