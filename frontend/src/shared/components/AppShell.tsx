import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutBase, NavigationBar } from 'siesa-ui-kit'
import type { NavigationBarItem, NavigationRailGroupMenuItem } from 'siesa-ui-kit'
import { UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface AppShellProps {
  children: ReactNode
}

/**
 * siesa-ui-kit's NavigationRailGroup only exposes `aria-current`/an active
 * data attribute on its rendered <button> in `collapsed` state — in
 * `expanded` state (used here so labels are visible per AC1) the active
 * item is only distinguished visually (background/text color classes),
 * with no accessible "current item" marker on the button itself.
 * This wraps the item's icon (a ReactNode we fully control) to tag the
 * nearest ancestor <button> with `data-active`, restoring an accessible/
 * testable active-state marker without patching the third-party component.
 */
function RailIcon({ icon, active }: { icon: ReactNode; active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const button = ref.current?.closest('button')
    if (!button) return
    if (active) {
      button.setAttribute('data-active', 'true')
      button.setAttribute('aria-current', 'page')
    } else {
      button.removeAttribute('data-active')
      button.removeAttribute('aria-current')
    }
  }, [active])

  return (
    <span ref={ref} className="inline-flex">
      {icon}
    </span>
  )
}

type NavSectionId = 'clientes' | 'contactos'

const NAV_SECTIONS: Array<{ id: NavSectionId; label: string; path: `/${NavSectionId}` }> = [
  { id: 'clientes', label: 'Clientes', path: '/clientes' },
  { id: 'contactos', label: 'Contactos', path: '/contactos' },
]

const DESKTOP_QUERY = '(min-width: 1024px)'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(DESKTOP_QUERY)
    const handleChange = () => setIsDesktop(mediaQueryList.matches)
    handleChange()
    mediaQueryList.addEventListener('change', handleChange)
    window.addEventListener('resize', handleChange)
    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
      window.removeEventListener('resize', handleChange)
    }
  }, [])

  return isDesktop
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isDesktop = useIsDesktop()

  const activeId = NAV_SECTIONS.find((section) => pathname.startsWith(section.path))?.id

  const goTo = (path: `/${NavSectionId}`) => navigate({ to: path })

  const railItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <RailIcon active={activeId === 'clientes'} icon={<UsersIcon className="h-4 w-4" aria-hidden="true" />} />,
      active: activeId === 'clientes',
      onClick: () => goTo('/clientes'),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: (
        <RailIcon
          active={activeId === 'contactos'}
          icon={<UserGroupIcon className="h-4 w-4" aria-hidden="true" />}
        />
      ),
      active: activeId === 'contactos',
      onClick: () => goTo('/contactos'),
    },
  ]

  const barItems: NavigationBarItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="h-5 w-5" aria-hidden="true" />,
      active: activeId === 'clientes',
      ariaLabel: 'Clientes',
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserGroupIcon className="h-5 w-5" aria-hidden="true" />,
      active: activeId === 'contactos',
      ariaLabel: 'Contactos',
    },
  ]

  const handleBarItemClick = (id: string) => {
    const section = NAV_SECTIONS.find((item) => item.id === id)
    if (section) {
      goTo(section.path)
    }
  }

  return (
    <div>
      <span data-testid="app-shell-location" className="sr-only">
        {pathname}
      </span>
      {isDesktop ? (
        <div data-testid="navigation-rail">
          <LayoutBase
            productName="Siesa Agents"
            navigationItems={railItems}
            navigationRailProps={{ state: 'expanded' }}
          >
            {children}
          </LayoutBase>
        </div>
      ) : (
        <div>
          <div className="pb-14">{children}</div>
          <div data-testid="navigation-bar">
            <NavigationBar
              items={barItems}
              activeItemId={activeId}
              onItemClick={handleBarItemClick}
              ariaLabel="Navegación principal"
            />
          </div>
        </div>
      )}
    </div>
  )
}
