import { createFileRoute, Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { useMediaQuery } from '../shared/hooks/useMediaQuery'

interface NavItem {
  id: string
  label: string
  path: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: 'clientes', label: 'Clientes', path: '/clientes', icon: <UsersIcon className="w-5 h-5" /> },
  { id: 'contactos', label: 'Contactos', path: '/contactos', icon: <UserIcon className="w-5 h-5" /> },
]

function MobileNavItem({ item }: { item: NavItem }) {
  const router = useRouter()
  const routerState = useRouterState()
  const isActive = routerState.location.pathname.startsWith(item.path)

  return (
    <button
      type="button"
      aria-label={item.label}
      onClick={() => router.navigate({ to: item.path })}
      style={{
        minHeight: '44px',
        minWidth: '44px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '8px',
        paddingBottom: '8px',
        fontSize: '12px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        transition: 'color 150ms, background-color 150ms',
        backgroundColor: isActive ? '#eff6ff' : 'transparent',
        color: isActive ? '#0e79fd' : '#475569',
      }}
    >
      {item.icon}
      {item.label}
    </button>
  )
}

function AppShell() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div
      data-testid="app-shell"
      style={{
        display: 'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        height: '100vh',
      }}
    >
      {/* Desktop NavigationRail — shown on desktop, hidden on mobile */}
      <nav
        aria-label="Navegación principal"
        data-testid="nav-rail"
        style={{
          display: isDesktop ? 'flex' : 'none',
          flexDirection: 'column',
          width: isDesktop ? '224px' : '64px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          height: '100%',
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            aria-label={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              color: '#475569',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
            activeProps={{
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: '#0e79fd',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: '#eff6ff',
              },
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: isDesktop ? 0 : '64px',
        }}
      >
        <Outlet />
      </main>

      {/* Mobile NavigationBar — shown on mobile, hidden on desktop */}
      <div
        data-testid="nav-bar"
        role="navigation"
        aria-label="Navegación principal móvil"
        style={{
          display: isDesktop ? 'none' : 'flex',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        {navItems.map((item) => (
          <MobileNavItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_app')({
  component: AppShell,
})
