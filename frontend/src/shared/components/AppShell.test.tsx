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
  })
})
