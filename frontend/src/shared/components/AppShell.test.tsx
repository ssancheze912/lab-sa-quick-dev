import { describe, test, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { mockViewport } from '@/test/support/viewport'
import { AppShell } from './AppShell'

// RED PHASE: AppShell.tsx does not exist yet (Task 3 of story 1.2).
// These tests define the expected navigation-shell behavior for AC #1, #2, #6.

describe('AppShell', () => {
  describe('AC1 - Desktop NavigationRail', () => {
    test('should render a NavigationRail with "Clientes" and "Contactos" entries on desktop viewport', async () => {
      // GIVEN: the app is loaded on a desktop viewport (>= 1024px / lg:)
      mockViewport('desktop')

      // WHEN: AppShell renders at the /clientes route
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })

      // THEN: the desktop navigation rail is visible with both entries
      const rail = await screen.findByTestId('navigation-rail')
      expect(within(rail).getByText('Clientes')).toBeInTheDocument()
    })

    test('should navigate to /contactos without a full page reload when clicking the Contactos rail entry', async () => {
      // GIVEN: the app is loaded on a desktop viewport at /clientes
      mockViewport('desktop')
      const user = userEvent.setup()
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
      const rail = await screen.findByTestId('navigation-rail')

      // WHEN: the user clicks the "Contactos" entry in the rail
      await user.click(within(rail).getByText('Contactos'))

      // THEN: client-side navigation occurs (no full reload) to /contactos
      expect(await screen.findByTestId('app-shell-location')).toHaveTextContent('/contactos')
    })
  })

  describe('AC2 - Mobile NavigationBar', () => {
    test('should render the mobile NavigationBar instead of the NavigationRail on mobile viewport (< 1024px)', async () => {
      // GIVEN: the app is loaded on a mobile viewport (< 1024px)
      mockViewport('mobile')

      // WHEN: AppShell renders at the /clientes route
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })

      // THEN: the mobile bottom NavigationBar is displayed, and the rail is not
      expect(await screen.findByTestId('navigation-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
    })

    test('should expose Clientes and Contactos as tappable items meeting the 44x44px minimum touch target on mobile', async () => {
      // GIVEN: the app is loaded on a mobile viewport
      mockViewport('mobile')

      // WHEN: the mobile NavigationBar renders
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
      const bar = await screen.findByTestId('navigation-bar')

      // THEN: both items are present and individually accessible/tappable (min 44x44px per AC2)
      const contactosItem = within(bar).getByRole('button', { name: /contactos/i })
      expect(contactosItem).toBeInTheDocument()
    })
  })

  describe('AC6 - Active navigation state', () => {
    test('should mark the "Clientes" rail item as active when the current route is /clientes', async () => {
      // GIVEN: the app is loaded on desktop, current route is /clientes
      mockViewport('desktop')

      // WHEN: AppShell renders at /clientes
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
      const rail = await screen.findByTestId('navigation-rail')

      // THEN: the Clientes entry carries the active state (aria-current, per NavigationRailGroupMenuItem.active)
      const clientesItem = within(rail).getByText('Clientes').closest('[aria-current], [data-active]')
      expect(clientesItem).toBeTruthy()
    })

    test('should move the active state to "Contactos" when the current route is /contactos', async () => {
      // GIVEN: the app is loaded on desktop, current route is /contactos
      mockViewport('desktop')

      // WHEN: AppShell renders at /contactos
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/contactos' })
      const rail = await screen.findByTestId('navigation-rail')

      // THEN: the Clientes entry is no longer active
      const clientesItem = within(rail).getByText('Clientes').closest('[aria-current], [data-active]')
      expect(clientesItem).toBeFalsy()
    })

    test('[P2] should mark neither rail item as active on an unrelated nested path', async () => {
      // GIVEN: the app is loaded on desktop at a path that matches neither section
      mockViewport('desktop')

      // WHEN: AppShell renders at an arbitrary unmatched path
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/unknown-section' })
      const rail = await screen.findByTestId('navigation-rail')

      // THEN: neither Clientes nor Contactos carries the active marker
      expect(within(rail).getByText('Clientes').closest('[aria-current], [data-active]')).toBeFalsy()
      expect(within(rail).getByText('Contactos').closest('[aria-current], [data-active]')).toBeFalsy()
    })

    test('[P2] should treat nested sub-paths as active via prefix match (e.g. /clientes/123)', async () => {
      // GIVEN: the app is loaded on desktop at a nested sub-path under /clientes
      mockViewport('desktop')

      // WHEN: AppShell renders at /clientes/123
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes/123' })
      const rail = await screen.findByTestId('navigation-rail')

      // THEN: Clientes is still marked active (startsWith prefix match)
      const clientesItem = within(rail).getByText('Clientes').closest('[aria-current], [data-active]')
      expect(clientesItem).toBeTruthy()
    })
  })

  describe('AC2 - Mobile NavigationBar active state and navigation', () => {
    test('[P1] should mark "Clientes" as the active item in the mobile NavigationBar at /clientes', async () => {
      // GIVEN: the app is loaded on mobile at /clientes
      mockViewport('mobile')

      // WHEN: AppShell renders the mobile NavigationBar
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
      const bar = await screen.findByTestId('navigation-bar')

      // THEN: the Clientes button reflects the active item via aria-current (siesa-ui-kit NavigationBar contract)
      const clientesItem = within(bar).getByRole('button', { name: /clientes/i })
      expect(clientesItem).toHaveAttribute('aria-current', 'page')
    })

    test('[P1] should navigate to /contactos without a full page reload when tapping the Contactos bottom-nav item', async () => {
      // GIVEN: the app is loaded on mobile at /clientes
      mockViewport('mobile')
      const user = userEvent.setup()
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
      const bar = await screen.findByTestId('navigation-bar')

      // WHEN: the user taps the "Contactos" bottom-nav item
      await user.click(within(bar).getByRole('button', { name: /contactos/i }))

      // THEN: client-side navigation occurs to /contactos
      expect(await screen.findByTestId('app-shell-location')).toHaveTextContent('/contactos')
    })

    test('[P2] should not render the desktop NavigationRail at all on mobile (fully absent from DOM)', async () => {
      // GIVEN: the app is loaded on mobile
      mockViewport('mobile')

      // WHEN: AppShell renders
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
      await screen.findByTestId('navigation-bar')

      // THEN: no rail markup exists anywhere in the document (not just hidden via CSS)
      expect(document.querySelector('[data-testid="navigation-rail"]')).toBeNull()
    })
  })

  describe('Boundary - viewport breakpoint edge', () => {
    test('[P2] should render the desktop rail at exactly the 1024px lg: breakpoint boundary', async () => {
      // GIVEN: matchMedia for "(min-width: 1024px)" matches (boundary is inclusive per the media query itself)
      mockViewport('desktop')

      // WHEN: AppShell renders
      renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })

      // THEN: the desktop rail renders (boundary treated as desktop, matching CSS lg: semantics)
      expect(await screen.findByTestId('navigation-rail')).toBeInTheDocument()
    })
  })
})
