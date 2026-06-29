import React, { useEffect, useState } from 'react'
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

const DESKTOP_BREAKPOINT = 1024

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true
  )
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    setIsDesktop(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

const NAV_BUTTON_BASE =
  'flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors'

const NAV_BUTTON_ACTIVE = 'text-[#0e79fd] bg-blue-50'
const NAV_BUTTON_INACTIVE = 'text-slate-600'

function NavItems({ items, activeId, onNavigate }: {
  items: NavItem[]
  activeId: string | undefined
  onNavigate: (item: NavItem) => void
}) {
  return (
    <>
      {items.map((item) => {
        const isActive = activeId === item.id
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`nav-item-${item.id}`}
            data-active={isActive ? 'true' : undefined}
            aria-label={item.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(item)}
            style={{ outline: 'none' }}
            onFocus={(e) => { e.currentTarget.style.outline = '2px solid #60b6fa'; e.currentTarget.style.outlineOffset = '2px' }}
            onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.outlineOffset = '0' }}
            className={[
              NAV_BUTTON_BASE,
              isActive ? NAV_BUTTON_ACTIVE : NAV_BUTTON_INACTIVE,
            ].join(' ')}
          >
            <span>{item.icon}</span>
            <span className="text-[10px] font-bold leading-3">{item.label}</span>
          </button>
        )
      })}
    </>
  )
}

function RootLayout() {
  const { location } = useRouterState()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const activeId = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.to)
  )?.id

  const handleNavClick = (item: NavItem) => {
    void navigate({ to: item.to })
  }

  return (
    <div className="flex h-screen">
      {isDesktop ? (
        <nav
          className="flex flex-col w-14 bg-white border-r border-slate-200 shrink-0 py-2"
          data-testid="navigation-rail"
          aria-label="Navegación principal"
          role="navigation"
        >
          <NavItems items={NAV_ITEMS} activeId={activeId} onNavigate={handleNavClick} />
        </nav>
      ) : null}

      <main className="flex-1 overflow-auto" style={{ paddingBottom: isDesktop ? 0 : 64 }}>
        <Outlet />
      </main>

      {!isDesktop ? (
        <nav
          className="flex fixed bottom-0 w-full bg-white border-t border-slate-200 z-10"
          data-testid="navigation-bar"
          aria-label="Navegación principal"
          role="navigation"
          style={{ height: 64 }}
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
                style={{ outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.outline = '2px solid #60b6fa'; e.currentTarget.style.outlineOffset = '2px' }}
                onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.outlineOffset = '0' }}
                className={[
                  'flex flex-1 flex-col items-center justify-center gap-1 py-2 px-1 cursor-pointer transition-colors',
                  isActive ? 'text-[#0e79fd]' : 'text-slate-600',
                ].join(' ')}
              >
                <span>{item.icon}</span>
                <span className="text-[10px] font-bold leading-3">{item.label}</span>
              </button>
            )
          })}
        </nav>
      ) : null}
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
