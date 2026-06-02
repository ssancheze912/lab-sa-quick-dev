import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navbar, NavigationBar, NavigationRailGroup } from 'siesa-ui-kit'
import type {
  NavigationBarItem,
  NavigationRailGroupMenuItem,
} from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

import { useShellNavigation } from './useShellNavigation'
import type { NavId } from './useShellNavigation'

interface AppShellProps {
  children: ReactNode
}

/**
 * Spanish aria-labels required by AC #8 / WCAG 2.1 AA for each desktop rail
 * entry. `NavigationRailGroupMenuItem` only exposes `label` (no `ariaLabel`
 * prop), so we set `aria-label` on the rendered `<button>` elements via a DOM
 * effect that matches buttons by their visible text. This preserves the
 * siesa-ui-kit composition (no custom navigation) while giving the rail items
 * the same accessible name as their mobile counterparts.
 */
const RAIL_ARIA_LABELS: Record<string, string> = {
  Clientes: 'Ir a Clientes',
  Contactos: 'Ir a Contactos',
}

/**
 * Application shell composing `siesa-ui-kit` primitives (`Navbar` +
 * `NavigationRailGroup` for desktop, `NavigationBar` for mobile) (Story 1.2 —
 * AC #1, #2, #7, #8).
 *
 * `siesa-ui-kit`'s `LayoutBase` is intentionally NOT used as the outer wrapper:
 * it embeds its own content slot, which would force the route children to be
 * mounted twice (once for the desktop shell, once for the mobile shell). By
 * composing the chrome primitives directly we can mount route children EXACTLY
 * ONCE inside a single `<main>` that is shared by both viewports — preserving
 * React tree identity across SPA navigation (required by TC-E1-P1-01).
 *
 * Responsive swap is Tailwind class-based (`hidden lg:block` / `lg:hidden`) —
 * NO JS media queries — per the responsive strategy in the story Dev Notes.
 *
 * URL is the source of truth for the active nav surface
 * (see {@link useShellNavigation}).
 *
 * Note on touch targets: `NavigationBar` (siesa-ui-kit) ships with ≥ 44×44px
 * tappable areas by default — do NOT shrink them with custom classes (WCAG
 * 2.1 AA).
 */
export function AppShell({ children }: AppShellProps) {
  const { activeId, onNavigate } = useShellNavigation()
  const railContainerRef = useRef<HTMLDivElement | null>(null)

  // Track whether we are above the `lg:` (1024px) breakpoint so we can mark
  // the OFF-SCREEN surface as `aria-hidden`. The visual swap remains
  // Tailwind-driven (`hidden lg:block` / `lg:hidden`) — this state is used
  // only to dedupe the accessibility tree so that screen readers (and Playwright /
  // RTL `getByRole`) see exactly one entry per nav item, matching what the
  // user actually perceives.
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    if (typeof window.matchMedia !== 'function') return true
    return window.matchMedia('(min-width: 1024px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Apply the Spanish aria-labels to the rendered rail buttons (AC #8).
  // Re-runs whenever the active surface changes (so re-renders triggered by
  // siesa-ui-kit's internal re-mounts on active toggle re-apply the label) —
  // avoids the unbounded "runs on every render" cost a missing dep array
  // would cause. siesa-ui-kit's NavigationRailGroup renders icon-only buttons
  // in collapsed state, so we match the button by either its existing
  // aria-label (set by the kit from `label`) OR its visible text (expanded state).
  useEffect(() => {
    const container = railContainerRef.current
    if (!container) return
    const buttons = container.querySelectorAll<HTMLButtonElement>('button')
    buttons.forEach((button) => {
      const key =
        button.getAttribute('aria-label')?.trim() ||
        button.textContent?.trim() ||
        ''
      const ariaLabel = RAIL_ARIA_LABELS[key]
      if (ariaLabel) {
        button.setAttribute('aria-label', ariaLabel)
      }
    })
  }, [activeId])

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="h-5 w-5" aria-hidden="true" />,
      active: activeId === 'clientes',
      onClick: () => onNavigate('clientes'),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="h-5 w-5" aria-hidden="true" />,
      active: activeId === 'contactos',
      onClick: () => onNavigate('contactos'),
    },
  ]

  const mobileItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="h-6 w-6" aria-hidden="true" />,
      active: activeId === 'clientes',
      ariaLabel: 'Ir a Clientes',
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="h-6 w-6" aria-hidden="true" />,
      active: activeId === 'contactos',
      ariaLabel: 'Ir a Contactos',
    },
  ]

  return (
    <div
      data-testid="app-root"
      className="min-h-screen flex flex-col bg-white text-slate-900"
    >
      {/* Desktop Navbar — hidden below `lg:` via Tailwind. Renders the product
          name "Siesa Agents" exactly once across the shell. */}
      <header className="hidden lg:block">
        <Navbar
          productName="Siesa Agents"
          hideActionButtons
          showSiesaLogoLeading
          showBusinessLogo={false}
        />
      </header>

      <div className="flex flex-1">
        {/* Desktop NavigationRail — hidden below `lg:` via Tailwind. The wrapper
            carries the `shell-rail-container` test id so the responsive contract
            can be asserted. */}
        <div
          ref={railContainerRef}
          data-testid="shell-rail-container"
          className="hidden lg:block"
          aria-hidden={!isDesktop || undefined}
        >
          <NavigationRailGroup
            items={navigationItems}
            showSearchButton={false}
          />
        </div>

        {/* Single source-of-truth content area. Mounted once so children render
            exactly once regardless of viewport (required by SPA navigation tests
            that assert React tree identity stability). The bottom padding leaves
            room for the mobile `NavigationBar` overlay. */}
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom-fixed NavigationBar. Hidden at `lg+` via Tailwind.
          Touch targets ≥ 44×44px are built into siesa-ui-kit — do NOT shrink. */}
      <div
        data-testid="shell-mobile-nav"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200"
        aria-hidden={isDesktop || undefined}
      >
        <NavigationBar
          items={mobileItems}
          activeItemId={activeId ?? undefined}
          onItemClick={(id: string) => onNavigate(id as NavId)}
          ariaLabel="Navegación principal"
        />
      </div>
    </div>
  )
}
