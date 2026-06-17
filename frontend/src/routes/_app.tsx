import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  BuildingOffice2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  to: '/clientes' | '/contactos'
}

const navItems: NavItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    icon: <BuildingOffice2Icon className="w-5 h-5" />,
    to: '/clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    icon: <UserGroupIcon className="w-5 h-5" />,
    to: '/contactos',
  },
]

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    setIsDesktop(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

export function AppLayout() {
  const router = useRouterState()
  const navigate = useNavigate()
  const currentPath = router.location.pathname
  const isDesktop = useIsDesktop()

  const isClientesActive = currentPath.startsWith('/clientes')
  const isContactosActive = currentPath.startsWith('/contactos')

  const getActiveId = () => {
    if (isClientesActive) return 'clientes'
    if (isContactosActive) return 'contactos'
    return ''
  }

  const activeId = getActiveId()

  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail on the left */}
      {isDesktop && (
        <nav
          data-testid="navigation-rail"
          className="flex flex-col bg-white border-r border-slate-200 w-20 py-4 items-center gap-2"
          aria-label="Navegación principal"
        >
          {navItems.map((item) => {
            const isActive = activeId === item.id
            return (
              <button
                key={item.id}
                data-testid={`nav-item-${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                onClick={() => navigate({ to: item.to })}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-2xl w-14 text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#dbeefe] text-[#0e79fd]'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>
      )}

      {/* Main content area */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at the bottom */}
      {!isDesktop && (
        <nav
          data-testid="navigation-bar"
          className="fixed bottom-0 inset-x-0 z-50 flex flex-row bg-white border-t border-slate-200"
          aria-label="Navegación principal"
        >
          {navItems.map((item) => {
            const isActive = activeId === item.id
            return (
              <button
                key={item.id}
                data-testid={`nav-item-${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                onClick={() => navigate({ to: item.to })}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-bold transition-colors cursor-pointer ${
                  isActive ? 'text-[#0e79fd]' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
