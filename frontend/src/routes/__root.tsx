import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/app/layout/AppShell'
import { MobileShell } from '@/app/layout/MobileShell'
import { NotFoundView } from '@/shared/components/NotFoundView'
import { useIsDesktop } from '@/app/layout/useIsDesktop'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  const isDesktop = useIsDesktop()
  return (
    <div
      data-testid="app-shell"
      className="min-h-dvh bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50"
    >
      {isDesktop ? (
        <AppShell>
          <Outlet />
        </AppShell>
      ) : (
        <MobileShell>
          <Outlet />
        </MobileShell>
      )}
    </div>
  )
}
