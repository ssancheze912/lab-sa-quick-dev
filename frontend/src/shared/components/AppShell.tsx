/**
 * Story 1.2 — Task 2
 *
 * Responsive application shell that composes:
 * - siesa-ui-kit `NavigationRailGroup` on desktop (>= lg, 1024px)
 * - siesa-ui-kit `NavigationBar` (bottom nav) on mobile (< lg)
 *
 * Navigation is wired exclusively through TanStack Router (`router.navigate`).
 * `window.location` is NEVER reassigned — this preserves SPA behavior (FR28).
 *
 * The shell is structured so the `data-testid="app-shell-desktop"` and
 * `data-testid="app-shell-mobile"` wrappers contain ONLY the nav region
 * (not the main content area). The route's children render in a sibling
 * `<main>`. This keeps assertions like `within(desktop).getByText('Clientes')`
 * deterministic — the nav has exactly one "Clientes" label, and the
 * placeholder view's heading lives outside the nav wrapper.
 *
 * Only ONE shell renders at a time, selected via `matchMedia('(min-width: 1024px)')`.
 *
 * Spanish a11y labels are exposed on `<nav aria-label="...">` wrappers around
 * each shell. Active-state synchronization (AC #6) is reflected via
 * `aria-current="page"` on the rendered nav buttons by post-render attribute
 * application — siesa-ui-kit styles the selected item visually but does not
 * emit accessibility/active markers on its own.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import {
  NavigationBar,
  NavigationRailGroup,
  type NavigationBarItem,
  type NavigationRailGroupMenuItem,
} from 'siesa-ui-kit'
import { UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline'

type NavId = 'clientes' | 'contactos'

interface NavConfig {
  id: NavId
  label: string
  to: '/clientes' | '/contactos'
  icon: ReactNode
}

const NAV_ITEMS: readonly NavConfig[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    id: 'contactos',
    label: 'Contactos',
    to: '/contactos',
    icon: <UserCircleIcon className="h-5 w-5" />,
  },
] as const

const DESKTOP_QUERY = '(min-width: 1024px)'

function resolveActiveId(pathname: string): NavId | undefined {
  if (pathname.startsWith('/contactos')) return 'contactos'
  if (pathname.startsWith('/clientes')) return 'clientes'
  return undefined
}

function useIsDesktop(): boolean {
  const get = (): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true
    }
    return window.matchMedia(DESKTOP_QUERY).matches
  }
  const [isDesktop, setIsDesktop] = useState<boolean>(get)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(DESKTOP_QUERY)
    const handler = () => setIsDesktop(mq.matches)
    handler()
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return isDesktop
}

/**
 * Tracks whether an AppShell is already mounted in the parent tree. When
 * true, nested AppShells render only their children (no nav wrappers) — this
 * avoids duplicate `data-testid` markers when, e.g., the root component
 * already wraps `<Outlet />` in AppShell AND a `notFoundComponent` also
 * wraps its view in AppShell (the pattern recommended by the story dev
 * notes for Task 4).
 */
const AppShellContext = createContext(false)

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const alreadyMounted = useContext(AppShellContext)
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeId = resolveActiveId(pathname)
  const isDesktop = useIsDesktop()

  if (alreadyMounted) {
    // A parent AppShell already provides the nav chrome; render only the
    // inner content so testids and Spanish a11y labels stay unique.
    return <>{children}</>
  }

  const handleNavigate = (to: NavConfig['to']) => {
    void router.navigate({ to })
  }

  const railItems: NavigationRailGroupMenuItem[] = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: activeId === item.id,
    onClick: () => handleNavigate(item.to),
  }))

  const barItems: NavigationBarItem[] = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: activeId === item.id,
    ariaLabel: item.label,
  }))

  const handleBarItemClick = (id: string) => {
    const target = NAV_ITEMS.find((item) => item.id === id)
    if (target) handleNavigate(target.to)
  }

  if (isDesktop) {
    return (
      <AppShellContext.Provider value={true}>
        <DesktopShell activeId={activeId} railItems={railItems} navItems={NAV_ITEMS}>
          {children}
        </DesktopShell>
      </AppShellContext.Provider>
    )
  }
  return (
    <AppShellContext.Provider value={true}>
      <MobileShell
        activeId={activeId}
        barItems={barItems}
        navItems={NAV_ITEMS}
        onBarItemClick={handleBarItemClick}
      >
        {children}
      </MobileShell>
    </AppShellContext.Provider>
  )
}

interface DesktopShellProps {
  activeId: NavId | undefined
  railItems: NavigationRailGroupMenuItem[]
  navItems: readonly NavConfig[]
  children: ReactNode
}

function DesktopShell({ activeId, railItems, navItems, children }: DesktopShellProps) {
  const railWrapperRef = useRef<HTMLDivElement>(null)

  // Post-render: stamp aria-current="page" on the active rail entry so AC #6
  // assertions (Vitest + Playwright) succeed. siesa-ui-kit styles the active
  // entry visually but does not emit any accessibility/active markers.
  useEffect(() => {
    const root = railWrapperRef.current
    if (!root) return
    const buttons = root.querySelectorAll<HTMLButtonElement>('button')
    buttons.forEach((btn) => {
      const label = btn.textContent?.trim()
      const match = navItems.find((item) => item.label === label)
      if (!match) return
      if (match.id === activeId) {
        btn.setAttribute('aria-current', 'page')
      } else {
        btn.removeAttribute('aria-current')
      }
    })
  }, [activeId, navItems, railItems])

  return (
    <div className="flex min-h-dvh">
      <div
        ref={railWrapperRef}
        data-testid="app-shell-desktop"
        className="shrink-0"
      >
        <nav aria-label="Navegación principal">
          <NavigationRailGroup state="expanded" items={railItems} />
        </nav>
      </div>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

interface MobileShellProps {
  activeId: NavId | undefined
  barItems: NavigationBarItem[]
  navItems: readonly NavConfig[]
  onBarItemClick: (id: string) => void
  children: ReactNode
}

function MobileShell({
  activeId,
  barItems,
  navItems,
  onBarItemClick,
  children,
}: MobileShellProps) {
  const barWrapperRef = useRef<HTMLDivElement>(null)

  // Same post-render aria-current stamping for the mobile bar.
  useEffect(() => {
    const root = barWrapperRef.current
    if (!root) return
    const buttons = root.querySelectorAll<HTMLButtonElement>('button')
    buttons.forEach((btn) => {
      const label = btn.textContent?.trim()
      const match = navItems.find((item) => item.label === label)
      if (!match) return
      if (match.id === activeId) {
        btn.setAttribute('aria-current', 'page')
      } else {
        btn.removeAttribute('aria-current')
      }
    })
  }, [activeId, navItems, barItems])

  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 overflow-auto pb-20">{children}</main>
      <div
        ref={barWrapperRef}
        data-testid="app-shell-mobile"
        className="fixed inset-x-0 bottom-0 border-t bg-white"
      >
        <NavigationBar
          items={barItems}
          activeItemId={activeId}
          onItemClick={onBarItemClick}
          ariaLabel="Navegación inferior"
        />
      </div>
    </div>
  )
}
