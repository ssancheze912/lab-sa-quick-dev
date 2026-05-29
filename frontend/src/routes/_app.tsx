import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NavigationRail } from '../shared/components/ui/NavigationRail'
import { NavigationBar } from '../shared/components/ui/NavigationBar'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div id="single-spa-application" className="flex min-h-screen">
      {/* Desktop: NavigationRail on the left (>= 1024px) — hidden on mobile via CSS */}
      <div className="hidden lg:block">
        <NavigationRail />
      </div>

      {/* Main content area */}
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at bottom (< 1024px) — hidden on desktop via CSS */}
      <div className="block lg:hidden">
        <NavigationBar />
      </div>
    </div>
  )
}
