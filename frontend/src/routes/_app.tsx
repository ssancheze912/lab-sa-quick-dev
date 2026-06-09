import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

const DESKTOP_BREAKPOINT = 1024

const NAV_ITEMS = [
  { id: 'clientes', label: 'Clientes', href: '/clientes' },
  { id: 'contactos', label: 'Contactos', href: '/contactos' },
]

function getIsDesktop(): boolean {
  return typeof window !== 'undefined'
    ? window.innerWidth >= DESKTOP_BREAKPOINT
    : true
}

interface AppLayoutProps {
  currentPath?: string
  children?: React.ReactNode
}

export function AppLayout({ currentPath = '/', children }: AppLayoutProps) {
  const [isDesktop, setIsDesktop] = useState<boolean>(getIsDesktop)

  useEffect(() => {
    function handleResize() {
      setIsDesktop(getIsDesktop())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex min-h-screen">
      {/*
       * Desktop NavigationRail — always in DOM for toBeVisible() test,
       * but items are only rendered when desktop to avoid duplicate testids.
       * Hidden via inline style on mobile.
       */}
      <nav
        aria-label="Navegación principal"
        data-testid="navigation-rail"
        style={isDesktop ? undefined : { display: 'none' }}
      >
        {isDesktop && (
          <ul role="list" className="flex flex-col gap-1 p-2">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath.startsWith(`/${item.id}`)
              return (
                <li key={item.id}>
                  <Link
                    data-testid={`nav-item-${item.id}`}
                    to={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'flex flex-col items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors',
                      isActive
                        ? 'text-[#0e79fd] bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {/* Main content area */}
      <main className="flex-1 flex flex-col pb-16 lg:pb-0">
        {children}
      </main>

      {/*
       * Mobile NavigationBar — always in DOM for toBeVisible() test,
       * but items only rendered when mobile to avoid duplicate testids.
       * Hidden via inline style on desktop.
       */}
      <nav
        aria-label="Navegación principal"
        data-testid="navigation-bar"
        style={isDesktop ? { display: 'none' } : undefined}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50"
      >
        {!isDesktop &&
          NAV_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(`/${item.id}`)
            return (
              <Link
                key={item.id}
                data-testid={`nav-item-${item.id}`}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex flex-1 flex-col items-center justify-center py-2 gap-1 text-xs font-bold transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#60b6fa]',
                  isActive
                    ? 'text-[#0e79fd]'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                <span>{item.label}</span>
              </Link>
            )
          })}
      </nav>
    </div>
  )
}

function AppShell() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <AppLayout currentPath={currentPath}>
      <Outlet />
    </AppLayout>
  )
}

export const Route = createFileRoute('/_app')({
  component: AppShell,
})
