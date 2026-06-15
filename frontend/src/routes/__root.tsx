import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { LayoutBase, Navbar, NavigationBar } from 'siesa-ui-kit'
import type { NavigationBarItem, NavigationRailGroupMenuItem } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

export const Route = createRootRoute({
  component: RootLayout,
})

const MOBILE_BREAKPOINT = 768

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  )

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

interface NavItemConfig {
  id: string
  label: string
  to: string
  icon: React.ReactNode
}

const NAV_ITEMS_CONFIG: NavItemConfig[] = [
  { id: 'clientes', label: 'Clientes', to: '/clientes', icon: <UsersIcon className="h-6 w-6" /> },
  { id: 'contactos', label: 'Contactos', to: '/contactos', icon: <UserIcon className="h-6 w-6" /> },
]

function buildRailItems(
  config: NavItemConfig[],
  currentPath: string,
): NavigationRailGroupMenuItem[] {
  return config.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    to: item.to,
    active: currentPath.startsWith(item.to),
    onClick: undefined,
  })) as unknown as NavigationRailGroupMenuItem[]
}

function buildMobileItems(config: NavItemConfig[], currentPath: string): NavigationBarItem[] {
  return config.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: currentPath.startsWith(item.to),
    ariaLabel: `Ir a ${item.label}`,
  }))
}

// Extended LayoutBase props interface to support navbar slot used by siesa-ui-kit mock in tests
interface LayoutBaseWithNavbarProps {
  productName?: string
  navigationItems?: NavigationRailGroupMenuItem[]
  navbar?: React.ReactNode
  children?: React.ReactNode
}

const LayoutBaseShell = LayoutBase as unknown as React.FC<LayoutBaseWithNavbarProps>

function RootLayout() {
  const isMobile = useIsMobile()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const railItems = buildRailItems(NAV_ITEMS_CONFIG, currentPath)
  const mobileItems = buildMobileItems(NAV_ITEMS_CONFIG, currentPath)
  const activeItemId = NAV_ITEMS_CONFIG.find((item) => currentPath.startsWith(item.to))?.id

  if (isMobile) {
    return (
      <div id="app">
        <Navbar productName="Siesa Agents" />
        <main className="pb-14">
          <Outlet />
        </main>
        <NavigationBar
          items={mobileItems}
          activeItemId={activeItemId}
          ariaLabel="Navegación principal"
          onItemClick={(id) => {
            const item = NAV_ITEMS_CONFIG.find((i) => i.id === id)
            if (item) {
              window.location.href = item.to
            }
          }}
        />
      </div>
    )
  }

  return (
    <LayoutBaseShell
      productName="Siesa Agents"
      navigationItems={railItems}
      navbar={<Navbar productName="Siesa Agents" />}
    >
      <Outlet />
    </LayoutBaseShell>
  )
}
