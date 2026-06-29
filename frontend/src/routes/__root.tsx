import React from 'react'
import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { UserGroupIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import { useNavigate } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

interface NavItem {
  id: string
  label: string
  to: string
  ariaLabel: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    ariaLabel: 'Clientes',
    icon: <UserGroupIcon className="w-5 h-5" aria-hidden="true" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    ariaLabel: 'Contactos',
    icon: <IdentificationIcon className="w-5 h-5" aria-hidden="true" />,
  },
]

function RootLayout() {
  const { location } = useRouterState()
  const navigate = useNavigate()

  const activeId = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.to)
  )?.id

  const handleNavClick = (item: NavItem) => {
    void navigate({ to: item.to })
  }

  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail visible on lg+ screens */}
      <nav
        className="hidden lg:flex flex-col w-14 bg-white border-r border-slate-200 shrink-0 py-2"
        data-testid="navigation-rail"
        aria-label="Navegación principal"
        role="navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`nav-item-${item.id}`}
              data-active={isActive ? 'true' : undefined}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleNavClick(item)}
              className={[
                'flex flex-col items-center justify-center gap-1 w-full py-2 px-1 rounded-none',
                'focus:outline-[2px] focus:outline-[#60b6fa] focus:outline focus:outline-offset-2',
                'transition-colors cursor-pointer',
                isActive
                  ? 'text-[#0e79fd] bg-blue-50'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
              ].join(' ')}
            >
              <span className={isActive ? 'text-[#0e79fd]' : 'text-slate-600'}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold leading-3">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Main content area */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar visible below lg screens */}
      <nav
        className="flex lg:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-10"
        data-testid="navigation-bar"
        aria-label="Navegación principal"
        role="navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`nav-item-${item.id}`}
              data-active={isActive ? 'true' : undefined}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleNavClick(item)}
              className={[
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 px-1',
                'focus:outline-[2px] focus:outline-[#60b6fa] focus:outline focus:outline-offset-2',
                'transition-colors cursor-pointer',
                isActive
                  ? 'text-[#0e79fd]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
              ].join(' ')}
            >
              <span className={isActive ? 'text-[#0e79fd]' : 'text-slate-600'}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold leading-3">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function NotFoundView() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center"
      data-testid="not-found-view"
    >
      <h1
        className="text-2xl font-bold text-slate-800"
        data-testid="not-found-message"
      >
        Página no encontrada
      </h1>
      <p className="text-slate-600">La ruta que buscas no existe.</p>
      <Link
        to="/clientes"
        data-testid="not-found-back-link"
        className="text-[#0e79fd] hover:underline font-medium"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
