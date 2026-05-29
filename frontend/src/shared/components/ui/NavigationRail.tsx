import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { Link } from '@tanstack/react-router'

const navItems = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes' as const,
    icon: UsersIcon,
    ariaLabel: 'Ir a Clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos' as const,
    icon: UserIcon,
    ariaLabel: 'Ir a Contactos',
  },
]

interface NavigationRailProps {
  // activeRoute kept for backwards compatibility with unit tests;
  // active state is driven by TanStack Router's activeProps
  activeRoute?: string
}

export function NavigationRail(_props: NavigationRailProps = {}) {
  return (
    <nav
      data-testid="navigation-rail"
      aria-label="Navegación principal"
      className="flex flex-col gap-1 p-2 min-h-screen w-16 lg:w-56 bg-white border-r border-slate-200"
    >
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.id}
            to={item.to}
            data-testid={`nav-item-${item.id}`}
            aria-label={item.ariaLabel}
            activeProps={{ 'data-active': 'true' } as Record<`data-${string}`, unknown>}
            className="flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-2 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-siesa-blue transition-colors"
            activeOptions={{ exact: false }}
          >
            <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="text-xs lg:text-sm font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
