import type { ReactNode } from 'react'
import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/solid'
import { useMediaQuery } from '../shared/hooks/useMediaQuery'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

interface NavItem {
  id: string
  label: string
  icon: ReactNode
  to: string
}

const navItems: NavItem[] = [
  { id: 'clientes', label: 'Clientes', icon: <UsersIcon className="w-6 h-6" />, to: '/clientes' },
  { id: 'contactos', label: 'Contactos', icon: <UserIcon className="w-6 h-6" />, to: '/contactos' },
]

export function AppLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop NavigationRail (≥1024px) */}
        {isDesktop ? (
          <nav
            aria-label="Navegación principal"
            data-testid="navigation-rail"
            className="flex-shrink-0 w-20 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col"
          >
            {navItems.map((item) => {
              const isActive = currentPath === item.to || currentPath.startsWith(item.to + '/')
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  data-testid={`nav-item-${item.id}`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-3 min-h-[56px] w-full text-xs text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950 aria-[current=page]:text-primary-600 dark:aria-[current=page]:text-primary-300 aria-[current=page]:bg-primary-50 dark:aria-[current=page]:bg-primary-950 transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        ) : null}

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile NavigationBar (<1024px) */}
      {!isDesktop ? (
        <nav
          aria-label="Navegación principal"
          data-testid="navigation-bar"
          className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 fixed bottom-0 left-0 right-0 z-50 flex items-center"
        >
          {navItems.map((item) => {
            const isActive = currentPath.startsWith(item.to)
            return (
              <Link
                key={item.id}
                to={item.to}
                data-testid={`nav-item-${item.id}`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 min-h-[56px] flex-1 text-xs text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 aria-[current=page]:text-primary-600 dark:aria-[current=page]:text-primary-300 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      ) : null}
    </div>
  )
}
