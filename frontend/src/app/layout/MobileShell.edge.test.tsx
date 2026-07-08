/**
 * Story 1.2 — AC #2, #6 — Edge cases for the mobile shell.
 * Focuses on positioning, z-index, inactive state, and content scroll surface —
 * areas the ATDD suite (MobileShell.test.tsx) does not exercise directly.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { MobileShell } from './MobileShell'

declare global {
  // eslint-disable-next-line no-var
  var setMatchMediaWidth: (width: number) => void
}

async function mountMobileShell(initialPath = '/clientes') {
  const rootRoute = createRootRoute({
    component: () => (
      <MobileShell>
        <Outlet />
      </MobileShell>
    ),
  })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-view">Clientes</div>,
  })
  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-view">Contactos</div>,
  })
  const otraRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/otra',
    component: () => <div data-testid="otra-view" />,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([clientesRoute, contactosRoute, otraRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  const utils = render(<RouterProvider router={router} />)
  await waitFor(() => {
    expect(screen.getByTestId('mobile-nav-bar')).toBeInTheDocument()
  })
  return { ...utils, router }
}

describe('MobileShell (< lg) — edge cases', () => {
  beforeEach(() => {
    globalThis.setMatchMediaWidth(375)
  })

  it('[P1] GIVEN the mobile nav bar wrapper, THEN it is fixed to the bottom of the viewport', async () => {
    await mountMobileShell()
    const navBar = screen.getByTestId('mobile-nav-bar')
    expect(navBar.className).toMatch(/fixed/)
    expect(navBar.className).toMatch(/bottom-0/)
  })

  it('[P1] GIVEN the mobile nav bar wrapper, THEN it uses z-index 50 to sit above page content', async () => {
    await mountMobileShell()
    const navBar = screen.getByTestId('mobile-nav-bar')
    expect(navBar.className).toMatch(/z-50/)
  })

  it('[P1] GIVEN the mobile nav bar wrapper, THEN it spans the full horizontal width (inset-x-0)', async () => {
    await mountMobileShell()
    const navBar = screen.getByTestId('mobile-nav-bar')
    expect(navBar.className).toMatch(/inset-x-0/)
  })

  it('[P1] GIVEN MobileShell mounted at /otra (unrelated route), THEN neither nav item is marked active', async () => {
    await mountMobileShell('/otra')
    expect(screen.getByTestId('mobile-nav-item-clientes').getAttribute('data-active')).toBe('false')
    expect(screen.getByTestId('mobile-nav-item-contactos').getAttribute('data-active')).toBe(
      'false',
    )
  })

  it('[P2] GIVEN the mobile main content, THEN it has bottom padding to clear the fixed 56px NavigationBar', async () => {
    await mountMobileShell()
    const main = screen.getByTestId('mobile-main')
    // pb-14 = 3.5rem = 56px, matches NavigationBar height per kit spec.
    expect(main.className).toMatch(/pb-14/)
  })

  it('[P2] GIVEN the mobile main content, THEN it has top padding to clear the fixed Navbar', async () => {
    await mountMobileShell()
    const main = screen.getByTestId('mobile-main')
    expect(main.className).toMatch(/pt-16/)
  })

  it('[P2] GIVEN the mobile main content, THEN it is scrollable (overflow-y-auto) so long lists do not push the nav off-screen', async () => {
    await mountMobileShell()
    const main = screen.getByTestId('mobile-main')
    expect(main.className).toMatch(/overflow-y-auto/)
  })

  it('[P1] GIVEN both mobile items render, THEN each icon is aria-hidden so screen readers announce the label', async () => {
    await mountMobileShell()
    const clientesIcon = screen.getByTestId('mobile-nav-item-clientes').querySelector('svg')
    const contactosIcon = screen.getByTestId('mobile-nav-item-contactos').querySelector('svg')
    expect(clientesIcon?.getAttribute('aria-hidden')).toBe('true')
    expect(contactosIcon?.getAttribute('aria-hidden')).toBe('true')
  })
})
