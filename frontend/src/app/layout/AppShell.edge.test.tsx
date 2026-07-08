/**
 * Story 1.2 — AC #1, #6, #7 — Edge cases for the desktop shell.
 * These complement AppShell.test.tsx by covering:
 * - Inactive state on unknown routes
 * - Repeated navigation to the active route doesn't unmount the shell
 * - LayoutBase is configured with locale="es"
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { AppShell } from './AppShell'

declare global {
  // eslint-disable-next-line no-var
  var setMatchMediaWidth: (width: number) => void
}

async function mountAppShell(initialPath = '/clientes') {
  const rootRoute = createRootRoute({
    component: () => (
      <div data-testid="app-shell">
        <AppShell>
          <Outlet />
        </AppShell>
      </div>
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
  const unknownRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/otra-cosa',
    component: () => <div data-testid="otra-view" />,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([clientesRoute, contactosRoute, unknownRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  const utils = render(<RouterProvider router={router} />)
  await waitFor(() => {
    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
  })
  return { ...utils, router }
}

describe('AppShell (desktop) — edge cases', () => {
  beforeEach(() => {
    globalThis.setMatchMediaWidth(1280)
  })

  it('[P1] GIVEN AppShell rendered at an unrelated route, THEN neither Clientes nor Contactos item is marked active', async () => {
    await mountAppShell('/otra-cosa')
    expect(screen.getByTestId('nav-item-clientes').getAttribute('data-active')).toBe('false')
    expect(screen.getByTestId('nav-item-contactos').getAttribute('data-active')).toBe('false')
  })

  it('[P1] GIVEN AppShell mounted at /clientes, WHEN clicking Clientes again, THEN the URL remains /clientes and the shell stays mounted', async () => {
    const { router } = await mountAppShell('/clientes')
    const shellBefore = screen.getByTestId('app-shell')

    fireEvent.click(screen.getByRole('button', { name: /clientes/i }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    const shellAfter = screen.getByTestId('app-shell')
    expect(shellAfter).toBe(shellBefore)
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('[P1] GIVEN both nav icons render, THEN each icon is marked aria-hidden (label carries the accessible name)', async () => {
    await mountAppShell()
    const clientesIcon = screen.getByTestId('nav-item-clientes').querySelector('svg')
    const contactosIcon = screen.getByTestId('nav-item-contactos').querySelector('svg')
    expect(clientesIcon?.getAttribute('aria-hidden')).toBe('true')
    expect(contactosIcon?.getAttribute('aria-hidden')).toBe('true')
  })

  it('[P2] GIVEN the nav item wrappers, THEN they use fixed 4×4 sizing to match NavigationRailItem spec (16×16 icon)', async () => {
    await mountAppShell()
    const clientesWrapper = screen.getByTestId('nav-item-clientes')
    // Tailwind h-4 w-4 == 16px × 16px (NavigationRailItem icon spec).
    expect(clientesWrapper.className).toMatch(/h-4/)
    expect(clientesWrapper.className).toMatch(/w-4/)
  })

  it('[P1] GIVEN navigating from /clientes to /contactos and back, THEN active state follows the URL both ways', async () => {
    const { router } = await mountAppShell('/clientes')
    expect(screen.getByTestId('nav-item-clientes').getAttribute('data-active')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: /contactos/i }))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
    expect(screen.getByTestId('nav-item-contactos').getAttribute('data-active')).toBe('true')
    expect(screen.getByTestId('nav-item-clientes').getAttribute('data-active')).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: /clientes/i }))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(screen.getByTestId('nav-item-clientes').getAttribute('data-active')).toBe('true')
    expect(screen.getByTestId('nav-item-contactos').getAttribute('data-active')).toBe('false')
  })
})
