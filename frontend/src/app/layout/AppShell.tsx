import type { ReactNode } from 'react'
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
          data-testid="shell-rail-container"
          className="hidden lg:block"
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
