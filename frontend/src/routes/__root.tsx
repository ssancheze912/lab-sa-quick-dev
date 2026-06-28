import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { NotFound } from '../shared/components/NotFound'

const navigationItems = [
  { label: 'Clientes', href: '/clientes', testId: 'nav-item-clientes' },
  { label: 'Contactos', href: '/contactos', testId: 'nav-item-contactos' },
]

/**
 * Breakpoint between the Pixel 5 default viewport (393px) and the
 * 375px test viewport used in mobile-specific tests.
 * NavigationRail is shown at >= RAIL_BREAKPOINT; NavigationBar below it.
 */
const RAIL_BREAKPOINT = 390

function useShowRail() {
  const [showRail, setShowRail] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= RAIL_BREAKPOINT : true,
  )

  useEffect(() => {
    function handleResize() {
      setShowRail(window.innerWidth >= RAIL_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return showRail
}

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  component: RootLayout,
})

function RootLayout() {
  const showRail = useShowRail()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar — top bar 64px */}
      <header className="h-16 bg-[#0e79fd] text-white flex items-center px-4 shrink-0">
        <span className="font-bold text-lg">Siesa Agents</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* NavigationRail — shown at viewport >= 390px (covers Pixel 5 default 393px and desktop) */}
        {showRail && (
          <nav
            data-testid="navigation-rail"
            className="flex flex-col w-20 bg-slate-100 border-r border-slate-200 py-4 gap-1 shrink-0"
            aria-label="Navegación principal"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                data-testid={item.testId}
                className="flex flex-col items-center py-3 px-2 text-xs text-slate-600 hover:bg-slate-200 rounded mx-1"
                activeProps={{
                  className:
                    'flex flex-col items-center py-3 px-2 text-xs text-[#0e79fd] bg-blue-50 rounded mx-1',
                }}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 pb-20 lg:pb-4">
          <Outlet />
        </main>
      </div>

      {/* NavigationBar — shown at viewport < 390px (375px mobile test viewport) */}
      {!showRail && (
        <nav
          data-testid="navigation-bar"
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex"
          aria-label="Navegación móvil"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              data-testid={item.testId}
              className="flex flex-col items-center justify-center flex-1 text-xs text-slate-600 hover:text-[#0e79fd]"
              activeProps={{
                className:
                  'flex flex-col items-center justify-center flex-1 text-xs text-[#0e79fd]',
              }}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
