import { createRootRoute, Outlet, Link, useRouter } from '@tanstack/react-router'
import { NavigationRailItem } from 'siesa-ui-kit'
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

type NavItemDef = {
  id: string
  label: string
  path: string
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'clientes', label: 'Clientes', path: '/clientes' },
  { id: 'contactos', label: 'Contactos', path: '/contactos' },
]

const DESKTOP_BREAKPOINT = 1024

function getNavIcon(id: string) {
  const cls = 'w-4 h-4'
  if (id === 'clientes') return <UserGroupIcon className={cls} />
  return <UserIcon className={cls} />
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    if (typeof window.matchMedia !== 'function') return window.innerWidth >= DESKTOP_BREAKPOINT
    return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches
  })

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    setIsDesktop(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

function RootLayout() {
  const router = useRouter()
  const currentPath = router.state.location.pathname
  const isDesktop = useIsDesktop()

  const activeItemId = currentPath.startsWith('/contactos')
    ? 'contactos'
    : currentPath.startsWith('/clientes')
      ? 'clientes'
      : undefined

  return (
    <div className="flex h-screen">
      {isDesktop ? (
        /* Desktop NavigationRail — vertical left rail */
        <nav
          className="flex flex-col items-center bg-white border-r border-slate-200 w-[72px] pt-2 gap-1"
          data-testid="navigation-rail"
          aria-label="Navegación principal"
        >
          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              data-testid={`nav-item-${item.id}`}
              aria-current={item.id === activeItemId ? 'page' : undefined}
            >
              <NavigationRailItem
                id={item.id}
                icon={getNavIcon(item.id)}
                label={item.label}
                selected={item.id === activeItemId}
                onClick={() => router.navigate({ to: item.path })}
                ariaLabel={`Ir a ${item.label}`}
              />
            </div>
          ))}
        </nav>
      ) : (
        /* Mobile NavigationBar — horizontal fixed bottom bar */
        <nav
          className="fixed bottom-0 w-full z-50 bg-white border-t border-slate-200 flex flex-row"
          data-testid="navigation-bar"
          aria-label="Navegación móvil"
        >
          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              data-testid={`nav-item-${item.id}`}
              aria-current={item.id === activeItemId ? 'page' : undefined}
              className="flex-1"
            >
              <NavigationRailItem
                id={item.id}
                icon={getNavIcon(item.id)}
                label={item.label}
                selected={item.id === activeItemId}
                onClick={() => router.navigate({ to: item.path })}
                ariaLabel={`Ir a ${item.label}`}
                className="w-full"
              />
            </div>
          ))}
        </nav>
      )}

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function NotFoundView() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4 min-h-screen"
      data-testid="not-found-view"
    >
      <h1
        className="text-2xl font-bold text-slate-800"
        data-testid="not-found-message"
      >
        Página no encontrada
      </h1>
      <p className="text-slate-500">La ruta solicitada no existe.</p>
      <Link
        to="/clientes"
        className="px-4 py-2 bg-[#0e79fd] text-white rounded-md hover:bg-[#154ca9] transition-colors"
        data-testid="not-found-back-link"
      >
        Volver a Clientes
      </Link>
    </div>
  )
}
