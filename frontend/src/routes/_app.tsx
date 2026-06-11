import React from 'react'
import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

interface NavItem {
  id: string
  label: string
  to: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <UsersIcon className="h-5 w-5" />,
  },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 1023px)').matches)
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function AppLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const isMobile = useIsMobile()

  const activeId = navItems.find((item) => currentPath.startsWith(item.to))?.id ?? ''

  return (
    <div className="flex h-screen overflow-hidden">
      {isMobile ? (
        /* Main content with NavigationBar at bottom — mobile (< 1024px) */
        <main data-testid="main-content" className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto pb-16">
            <Outlet />
          </div>

          <nav
            data-testid="navigation-bar"
            aria-label="Navegación móvil"
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
          >
            <div className="flex w-full">
              {navItems.map((item) => {
                const isActive = item.id === activeId
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    data-testid={`nav-item-${item.id}`}
                    data-active={isActive ? 'true' : 'false'}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                      isActive
                        ? 'text-[#0e79fd]'
                        : 'text-slate-500 hover:text-slate-700',
                    ].join(' ')}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </main>
      ) : (
        <>
          {/* NavigationRail — desktop (>= 1024px) */}
          <nav
            data-testid="navigation-rail"
            aria-label="Navegación principal"
            className="flex flex-col items-center w-20 bg-white border-r border-slate-200 py-4 gap-2"
          >
            {navItems.map((item) => {
              const isActive = item.id === activeId
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  data-testid={`nav-item-${item.id}`}
                  data-active={isActive ? 'true' : 'false'}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex flex-col items-center gap-1 p-2 rounded-lg w-16 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-[#0e79fd]/10 text-[#0e79fd]'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                  ].join(' ')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Main content */}
          <main data-testid="main-content" className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>
          </main>
        </>
      )}
    </div>
  )
}
