import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
import { NavigationRailItem, NavigationBar } from 'siesa-ui-kit'
import {
  UsersIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

const navItems = [
  {
    id: 'clientes',
    label: 'Clientes',
    icon: <UsersIcon className="size-4" />,
    to: '/clientes',
    ariaLabel: 'Ir a Clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    icon: <UserIcon className="size-4" />,
    to: '/contactos',
    ariaLabel: 'Ir a Contactos',
  },
]

function RootLayout() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const activeItemId = navItems.find((item) =>
    currentPath.startsWith(item.to),
  )?.id

  const handleNavigate = (id: string) => {
    const item = navItems.find((i) => i.id === id)
    if (item) {
      router.navigate({ to: item.to })
    }
  }

  const barItems = navItems.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    ariaLabel: item.ariaLabel,
    active: item.id === activeItemId,
    onClick: (id: string) => handleNavigate(id),
  }))

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Desktop: NavigationRail on left — visible at lg and above */}
      <nav
        aria-label="Navegación principal"
        className="hidden lg:flex flex-col h-full"
        data-testid="navigation-rail"
      >
        {navItems.map((item) => {
          const isActive = item.id === activeItemId
          return (
            <div
              key={item.id}
              data-testid={`nav-item-${item.id}`}
              aria-current={isActive ? 'page' : undefined}
              className="focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2 rounded"
            >
              <NavigationRailItem
                id={item.id}
                label={item.label}
                icon={item.icon}
                ariaLabel={item.ariaLabel}
                selected={isActive}
                onClick={() => handleNavigate(item.id)}
              />
            </div>
          )
        })}
      </nav>

      {/* Content area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at bottom — visible below lg */}
      <nav
        aria-label="Navegación principal"
        className="flex lg:hidden fixed bottom-0 left-0 w-full z-50 bg-white border-t border-slate-200"
        data-testid="navigation-bar"
      >
        {navItems.map((item) => {
          const isActive = item.id === activeItemId
          return (
            <button
              key={item.id}
              data-testid={`nav-bar-item-${item.id}`}
              onClick={() => handleNavigate(item.id)}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex flex-col items-center justify-center flex-1 py-2 gap-1',
                'focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2',
                isActive ? 'text-[#0e79fd]' : 'text-slate-500',
              ].join(' ')}
            >
              {item.icon}
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
      data-testid="not-found-view"
      className="flex flex-col items-center justify-center min-h-screen p-8 text-center"
    >
      <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
      <p className="text-lg text-slate-600 mb-8">
        La página que buscas no existe.
      </p>
      <a
        href="/clientes"
        data-testid="not-found-home-link"
        className="px-6 py-3 bg-[#0e79fd] text-white rounded-lg font-medium hover:bg-[#154ca9] focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2 transition-colors"
      >
        Volver al inicio
      </a>
    </div>
  )
}
