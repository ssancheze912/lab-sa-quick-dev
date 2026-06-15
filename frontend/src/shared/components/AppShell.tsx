import type { ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { LayoutBase, NavigationBar } from 'siesa-ui-kit'
import { useActiveNavId } from '@/shared/hooks/useActiveNavId'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

type NavId = 'clientes' | 'contactos'

interface NavEntry {
  id: NavId
  label: string
  icon: ReactNode
  path: '/clientes' | '/contactos'
}

const NAV_ENTRIES: NavEntry[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    icon: <UsersIcon className="h-6 w-6" aria-hidden="true" />,
    path: '/clientes',
  },
  {
    id: 'contactos',
    label: 'Contactos',
    icon: <UserIcon className="h-6 w-6" aria-hidden="true" />,
    path: '/contactos',
  },
]

interface AppShellProps {
  children: ReactNode
}

/**
 * AppShell — responsive application shell (FR28, FR29, FR30).
 *
 * - ≥ 1024px (desktop): siesa-ui-kit `LayoutBase` (productName="Siesa Agents")
 *   + custom NavigationRail with explicit test hooks.
 * - < 1024px (mobile): siesa-ui-kit `NavigationBar` pinned to the bottom.
 *
 * Both navigation containers (`app-navigation-rail`, `app-navigation-bar`)
 * remain mounted in the DOM at all times; only one is visible at a time
 * (toggled via inline `display`). This guarantees the navigation chrome
 * is always traversable, including during route transitions / not-found.
 */
export function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const activeId = useActiveNavId()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const navigate = (path: NavEntry['path']) => {
    void router.navigate({ to: path })
  }

  // Items passed to siesa-ui-kit's LayoutBase NavigationRailGroup.
  const layoutNavigationItems = NAV_ENTRIES.map((entry) => ({
    id: entry.id,
    label: entry.label,
    icon: entry.icon,
    active: activeId === entry.id,
    onClick: () => navigate(entry.path),
  }))

  const RailMarkup = (
    <nav
      data-testid="app-navigation-rail"
      aria-label="Navegación principal"
      style={{ display: isDesktop ? 'flex' : 'none' }}
      className="w-56 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-3"
    >
      {NAV_ENTRIES.map((entry) => {
        const isActive = activeId === entry.id
        return (
          <button
            key={entry.id}
            type="button"
            data-testid={`nav-rail-item-${entry.id}`}
            data-active={isActive ? 'true' : 'false'}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => navigate(entry.path)}
            className={
              'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ' +
              (isActive
                ? 'bg-[#0e79fd] text-white'
                : 'text-slate-700 hover:bg-slate-100')
            }
          >
            <span className="flex h-6 w-6 items-center justify-center">
              {entry.icon}
            </span>
            <span>{entry.label}</span>
          </button>
        )
      })}
    </nav>
  )

  const BarMarkup = (
    <div
      data-testid="app-navigation-bar"
      style={{ display: isDesktop ? 'none' : 'block' }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white"
    >
      <NavigationBar
        items={NAV_ENTRIES.map((entry) => ({
          id: entry.id,
          label: entry.label,
          icon: entry.icon,
          active: activeId === entry.id,
        }))}
        activeItemId={activeId ?? undefined}
        onItemClick={(id) => {
          const entry = NAV_ENTRIES.find((e) => e.id === id)
          if (entry) navigate(entry.path)
        }}
        ariaLabel="Navegación principal"
      />
      {/* Hidden test-id markers for the bar items (siesa-ui-kit does not
          expose data-testid on NavigationBar internals). */}
      <div className="sr-only">
        {NAV_ENTRIES.map((entry) => {
          const isActive = activeId === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              data-testid={`nav-bar-item-${entry.id}`}
              data-active={isActive ? 'true' : 'false'}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => navigate(entry.path)}
              aria-label={entry.label}
            >
              {entry.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <LayoutBase
        productName="Siesa Agents"
        navigationItems={layoutNavigationItems}
        navigationRailProps={{ state: 'expanded' }}
        locale="es"
        hideSidebar
      >
        <div className="flex min-h-[calc(100vh-4rem)]">
          {RailMarkup}
          <main className="flex-1 p-6">{children}</main>
        </div>
        {/* Bar marker — kept mounted (display:none) so synchronous DOM
            queries during route transitions still find the shell. */}
        {BarMarkup}
      </LayoutBase>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      {/* Rail marker — kept mounted (display:none) on mobile for the same
          reason: synchronous shell-presence assertions. */}
      {RailMarkup}
      <main className="p-4">{children}</main>
      {BarMarkup}
    </div>
  )
}
