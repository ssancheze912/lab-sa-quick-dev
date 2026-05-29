import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { Link } from '@tanstack/react-router'

interface NavigationBarProps {
  activeRoute?: string
}

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

export function NavigationBar({ activeRoute }: NavigationBarProps) {
  return (
    <nav
      data-testid="navigation-bar"
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 bg-white border-t border-slate-200 z-50"
    >
      {navItems.map((item) => {
        const isActive = activeRoute === item.to
        const Icon = item.icon
        return (
          <Link
            key={item.id}
            to={item.to}
            data-testid={`nav-item-${item.id}`}
            aria-label={item.ariaLabel}
            data-active={isActive ? 'true' : undefined}
            activeProps={{ 'data-active': 'true' } as React.AnchorHTMLAttributes<HTMLAnchorElement>}
            className="flex flex-col items-center gap-1 px-4 py-2 text-slate-600 hover:text-[#0e79fd] transition-colors"
            activeOptions={{ exact: false }}
          >
            <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
