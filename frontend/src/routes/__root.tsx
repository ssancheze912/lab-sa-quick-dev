import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
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
    icon: <UsersIcon className="size-6" />,
    to: '/clientes',
    ariaLabel: 'Ir a Clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    icon: <UserIcon className="size-6" />,
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

  const railItems = navItems.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    ariaLabel: item.ariaLabel,
    selected: item.id === activeItemId,
    onClick: () => handleNavigate(item.id),
  }))

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
      >
        <NavigationRail
          items={railItems}
          selectedId={activeItemId}
          onItemSelect={handleNavigate}
        />
      </nav>

      {/* Content area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at bottom — visible below lg */}
      <nav
        aria-label="Navegación principal"
        className="flex lg:hidden fixed bottom-0 left-0 w-full z-50"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeItemId}
          onItemClick={handleNavigate}
          ariaLabel="Navegación principal"
        />
      </nav>
    </div>
  )
}

function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
      <p className="text-lg text-slate-600 mb-8">
        La página que buscas no existe.
      </p>
      <a
        href="/clientes"
        className="px-6 py-3 bg-[#0e79fd] text-white rounded-lg font-medium hover:bg-[#154ca9] focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-2 transition-colors"
      >
        Volver al inicio
      </a>
    </div>
  )
}
