import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NavigationRail } from '../shared/components/ui/NavigationRail'
import { NavigationBar } from '../shared/components/ui/NavigationBar'
import { useIsDesktop } from '../shared/hooks/useIsDesktop'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const isDesktop = useIsDesktop()

  return (
    <div id="single-spa-application" className="flex min-h-screen">
      {/* Desktop: NavigationRail on the left (>= 1024px) */}
      {isDesktop && <NavigationRail />}

      {/* Main content area */}
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at bottom (< 1024px) */}
      {!isDesktop && <NavigationBar />}
    </div>
  )
}
