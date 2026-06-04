import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { UsersIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { useState, useEffect, type ReactNode } from 'react'
import { QueryProvider } from '../app/providers/QueryProvider'

const DESKTOP_BREAKPOINT = 1024

interface NavItem {
  id: string
  label: string
  to: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon className="h-5 w-5" aria-hidden="true" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <IdentificationIcon className="h-5 w-5" aria-hidden="true" />,
  },
]

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT)

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isDesktop
}

function NavLinks({ className }: { className?: string }) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.id}
          to={item.to}
          data-testid={`nav-link-${item.id}`}
          aria-label={item.label}
          className={className}
          activeProps={{
            'aria-current': 'page' as const,
            className: 'text-[#0e79fd] bg-slate-100 dark:bg-slate-800',
          }}
        >
          {item.icon}
          <span className="text-xs font-medium">{item.label}</span>
        </Link>
      ))}
    </>
  )
}

function RootLayout() {
  const isDesktop = useIsDesktop()

  return (
    <QueryProvider>
    <div className="flex h-screen">
      {isDesktop ? (
        /* Desktop — NavigationRail on left side */
        <nav
          aria-label="Navegación principal"
          className="flex flex-col w-20 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-700"
          data-testid="navigation-rail"
        >
          <NavLinks className="flex flex-col items-center justify-center gap-1 py-4 text-slate-500 hover:text-[#0e79fd] hover:bg-slate-50 transition-colors dark:text-slate-400 dark:hover:text-[#0e79fd] dark:hover:bg-slate-800" />
        </nav>
      ) : (
        /* Mobile — NavigationBar fixed at bottom */
        <nav
          aria-label="Navegación principal"
          className="fixed bottom-0 w-full flex bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-700 z-50"
          data-testid="navigation-bar"
        >
          <NavLinks className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-slate-500 hover:text-[#0e79fd] hover:bg-slate-50 transition-colors dark:text-slate-400 dark:hover:text-[#0e79fd] dark:hover:bg-slate-800 min-h-[44px]" />
        </nav>
      )}

      {/* Content area */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>
    </div>
    </QueryProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
