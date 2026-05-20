import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

interface NavItem {
  id: string
  to: '/' | '/clientes' | '/contactos'
  label: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navItems: NavItem[] = [
  { id: 'clientes', to: '/clientes', label: 'Clientes', Icon: UsersIcon },
  { id: 'contactos', to: '/contactos', label: 'Contactos', Icon: UserIcon },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop NavigationRail — visible on lg+ */}
      <nav
        data-testid="navigation-rail"
        aria-label="Navegación principal"
        className="hidden lg:flex flex-col w-[72px] bg-white border-r border-slate-200 shrink-0"
      >
        <ul className="flex flex-col items-center gap-1 pt-4">
          {navItems.map(({ id, to, label, Icon }) => {
            const isActive = currentPath === to || currentPath.startsWith(to + '/')
            return (
              <li key={id}>
                <Link
                  to={to}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex flex-col items-center justify-center gap-1 w-14 py-2 rounded-xl transition-colors',
                    'text-xs font-bold min-h-[44px]',
                    isActive
                      ? 'bg-[#dbeefe] text-[#0e79fd]'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">{children}</main>

      {/* Mobile NavigationBar — visible below lg */}
      <nav
        data-testid="navigation-bar"
        aria-label="Menú de navegación"
        className="flex lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
      >
        <ul className="flex w-full">
          {navItems.map(({ id, to, label, Icon }) => {
            const isActive = currentPath === to || currentPath.startsWith(to + '/')
            return (
              <li key={id} className="flex-1">
                <Link
                  to={to}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex flex-col items-center justify-center gap-1 w-full py-2 transition-colors',
                    'text-xs font-bold min-h-[56px]',
                    isActive
                      ? 'text-[#0e79fd] bg-[#dbeefe]'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
