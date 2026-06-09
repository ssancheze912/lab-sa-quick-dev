import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

interface NavItem {
  key: 'clientes' | 'contactos'
  label: string
  to: '/clientes' | '/contactos'
  icon: ReactNode
  testId: string
}

const ITEMS: NavItem[] = [
  {
    key: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon className="h-5 w-5" />,
    testId: 'clientes',
  },
  {
    key: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <UserIcon className="h-5 w-5" />,
    testId: 'contactos',
  },
]

const ACTIVE_RAIL =
  'border-l-2 border-[#0e79fd] bg-[#0e79fd]/10 text-[#154ca9]'
const INACTIVE_RAIL =
  'text-slate-500 hover:bg-slate-50 hover:text-slate-700'

const ACTIVE_BAR = 'text-[#0e79fd] bg-[#0e79fd]/10'
const INACTIVE_BAR = 'text-slate-500 hover:text-slate-700'

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop: NavigationRail (lg ≥ 1024px). Mobile-first: hidden by default. */}
      <aside
        data-testid="navigation-rail-wrapper"
        className="hidden lg:flex lg:w-[72px] lg:flex-col lg:border-r lg:border-slate-200"
      >
        <nav
          aria-label="Navegación principal"
          className="flex flex-1 flex-col gap-1 py-4"
        >
          {ITEMS.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              data-testid={`nav-rail-${item.testId}`}
              aria-label={item.label}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${INACTIVE_RAIL}`}
              activeProps={{
                className: `flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${ACTIVE_RAIL}`,
                'aria-current': 'page',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-4 pb-20 pt-4 lg:pb-4">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar (< lg). */}
      <nav
        data-testid="navigation-bar-wrapper"
        aria-label="Navegación inferior"
        className="fixed inset-x-0 bottom-0 z-50 flex h-14 border-t border-slate-200 bg-white lg:hidden"
      >
        {ITEMS.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            data-testid={`nav-bar-${item.testId}`}
            aria-label={item.label}
            className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${INACTIVE_BAR}`}
            activeProps={{
              className: `flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${ACTIVE_BAR}`,
              'aria-current': 'page',
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
