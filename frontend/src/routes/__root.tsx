import { createRootRoute, Outlet, useRouter, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { NavigationRailItem } from 'siesa-ui-kit'
import { UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { ToastContainer } from '../shared/components/ToastContainer'
import 'siesa-ui-kit/styles.css'

const DESKTOP_BREAKPOINT = 1024

interface NavItem {
  id: string
  label: string
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'clientes', label: 'Clientes', to: '/clientes' },
  { id: 'contactos', label: 'Contactos', to: '/contactos' },
]

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true,
  )

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isDesktop
}

function RootLayout() {
  const router = useRouter()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const pathname = router.state.location.pathname
  const activeId = NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.id ?? ''

  function handleNavSelect(id: string) {
    const item = NAV_ITEMS.find((n) => n.id === id)
    if (item) navigate({ to: item.to })
  }

  return (
    <div className="flex h-screen">
      {isDesktop ? (
        /* Desktop nav — left side */
        <nav aria-label="Navegación principal" className="flex flex-col" data-testid="nav-rail">
          <div className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                data-testid={`nav-item-${item.id}`}
                data-active={item.id === activeId ? 'true' : 'false'}
                onClick={() => handleNavSelect(item.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavSelect(item.id) } }}
                tabIndex={0}
                role="button"
                aria-label={item.label}
                style={{ cursor: 'pointer' }}
              >
                <NavigationRailItem
                  id={item.id}
                  label={item.label}
                  icon={
                    item.id === 'clientes' ? (
                      <UsersIcon className="h-5 w-5" />
                    ) : (
                      <UserGroupIcon className="h-5 w-5" />
                    )
                  }
                  selected={item.id === activeId}
                />
              </div>
            ))}
          </div>
        </nav>
      ) : (
        /* Mobile nav — bottom */
        <nav
          aria-label="Navegación principal"
          className="fixed bottom-0 w-full"
          data-testid="nav-bar"
        >
          <div className="flex flex-row w-full">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                data-testid={`nav-item-${item.id}`}
                data-active={item.id === activeId ? 'true' : 'false'}
                onClick={() => handleNavSelect(item.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavSelect(item.id) } }}
                tabIndex={0}
                role="button"
                aria-label={item.label}
                style={{ cursor: 'pointer', flex: 1 }}
              >
                <NavigationRailItem
                  id={item.id}
                  label={item.label}
                  icon={
                    item.id === 'clientes' ? (
                      <UsersIcon className="h-5 w-5" />
                    ) : (
                      <UserGroupIcon className="h-5 w-5" />
                    )
                  }
                  selected={item.id === activeId}
                />
              </div>
            ))}
          </div>
        </nav>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function NotFoundView() {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen p-6"
      data-testid="not-found-view"
    >
      <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
      <p className="text-slate-600 mb-6">La ruta que buscas no existe.</p>
      <Link
        to="/clientes"
        className="text-[#0e79fd] hover:underline"
        data-testid="not-found-back-link"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})
