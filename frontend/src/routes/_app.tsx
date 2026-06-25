import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  testId: string
  ariaLabel: string
}

const navItems: NavItem[] = [
  {
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon className="size-5" />,
    testId: 'nav-item-clientes',
    ariaLabel: 'Ir a Clientes',
  },
  {
    label: 'Contactos',
    to: '/contactos',
    icon: <UserIcon className="size-5" />,
    testId: 'nav-item-contactos',
    ariaLabel: 'Ir a Contactos',
  },
]

function NavLinks() {
  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          data-testid={item.testId}
          aria-label={item.ariaLabel}
          activeProps={{ 'aria-current': 'page' as const, className: 'nav-active text-[#0e79fd] font-semibold' }}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  )
}

const DESKTOP_BREAKPOINT = 1024

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

function AppLayout() {
  const isDesktop = useIsDesktop()

  return (
    <>
      <nav aria-label="Navegación principal">
        {isDesktop ? (
          /* Desktop: NavigationRail (left side, lg+) */
          <div
            className="flex flex-col gap-1 w-56 min-h-screen border-r border-slate-200 bg-white p-4"
            data-testid="navigation-rail"
          >
            <div className="mb-6">
              <span className="text-lg font-bold text-[#0e79fd]">Siesa Agents</span>
            </div>
            <NavLinks />
          </div>
        ) : (
          /* Mobile: NavigationBar (bottom) */
          <div
            className="flex fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 justify-around py-2 px-4"
            data-testid="navigation-bar"
          >
            <NavLinks />
          </div>
        )}
      </nav>

      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
    </>
  )
}

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})
