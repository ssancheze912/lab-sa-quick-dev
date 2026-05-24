/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

const ClientesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="w-6 h-6"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ContactosIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="w-6 h-6"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.7 12.14 19.79 19.79 0 0 1 1.65 3.5 2 2 0 0 1 3.62 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

interface NavItemConfig {
  id: string
  label: string
  to: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'clientes', label: 'Clientes', to: '/clientes', icon: <ClientesIcon /> },
  { id: 'contactos', label: 'Contactos', to: '/contactos', icon: <ContactosIcon /> },
]

const DESKTOP_BREAKPOINT = 1024

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return isDesktop
}

function NavItems({
  activeItemId,
  itemClassName,
}: {
  activeItemId: string | undefined
  itemClassName: (isActive: boolean) => string
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeItemId
        return (
          <Link
            key={item.id}
            to={item.to}
            data-testid={`nav-item-${item.id}`}
            data-active={isActive ? 'true' : 'false'}
            aria-current={isActive ? 'page' : undefined}
            className={itemClassName(isActive)}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </>
  )
}

function AppShell() {
  const { location } = useRouterState()
  const isDesktop = useIsDesktop()

  const activeItemId = location.pathname.startsWith('/clientes')
    ? 'clientes'
    : location.pathname.startsWith('/contactos')
      ? 'contactos'
      : undefined

  return (
    <div className="flex min-h-screen bg-white">
      {isDesktop ? (
        /* NavigationRail — desktop left sidebar */
        <nav
          data-testid="navigation-rail"
          aria-label="Navegación principal"
          className="flex flex-col h-screen sticky top-0 w-20 bg-white border-r border-slate-200"
        >
          <NavItems
            activeItemId={activeItemId}
            itemClassName={(isActive) =>
              `flex flex-col items-center justify-center gap-1 py-3 px-2 min-h-[48px] text-xs font-medium transition-colors ${
                isActive
                  ? 'text-[#0e79fd] bg-blue-50'
                  : 'text-slate-600 hover:text-[#0e79fd] hover:bg-blue-50'
              }`
            }
          />
        </nav>
      ) : (
        /* NavigationBar — mobile bottom bar (rendered in DOM for positioning, placed after main) */
        null
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {!isDesktop && (
        /* NavigationBar — mobile bottom bar */
        <nav
          data-testid="navigation-bar"
          aria-label="Navegación principal"
          className="fixed bottom-0 w-full z-50 flex bg-white border-t border-slate-200"
        >
          <NavItems
            activeItemId={activeItemId}
            itemClassName={(isActive) =>
              `flex flex-col items-center justify-center gap-1 flex-1 min-h-[48px] text-xs font-medium transition-colors ${
                isActive
                  ? 'text-[#0e79fd] bg-blue-50'
                  : 'text-slate-600 hover:text-[#0e79fd] hover:bg-blue-50'
              }`
            }
          />
        </nav>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_app')({
  component: AppShell,
})
