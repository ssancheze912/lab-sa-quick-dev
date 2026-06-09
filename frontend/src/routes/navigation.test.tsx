/**
 * RED PHASE — Story 1.2: Frontend Navigation Shell
 * Covers TC-E1-P1-01 (SPA navigation no full reload) and TC-E1-P1-02 / TC-E1-P1-03 (deep linking).
 *
 * These tests MUST FAIL until the `_app.tsx` shell, `_app/clientes.tsx` and
 * `_app/contactos.tsx` placeholder routes are wired into the router.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { Route as AppLayoutRoute } from './_app'
import { Route as ClientesRoute } from './_app/clientes'
import { Route as ContactosRoute } from './_app/contactos'

function buildTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const appLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_app',
    component: AppLayoutRoute.options.component,
  })
  const clientesRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/clientes',
    component: ClientesRoute.options.component,
  })
  const contactosRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/contactos',
    component: ContactosRoute.options.component,
  })
  const routeTree = rootRoute.addChildren([
    appLayoutRoute.addChildren([clientesRoute, contactosRoute]),
  ])
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('Story 1.2 — SPA navigation & deep linking', () => {
  beforeEach(() => {
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      })
    }
  })

  it('TC-E1-P1-01 — clicking the "Contactos" nav entry navigates client-side (no window.location.reload)', async () => {
    // GIVEN the router starts at /clientes and the shell is mounted
    const router = buildTestRouter('/clientes')
    const reloadSpy = vi.fn()
    const originalReload = window.location.reload
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      writable: true,
      value: reloadSpy,
    })

    render(<RouterProvider router={router} />)

    // confirm Clientes view is the initial view
    await screen.findByTestId('clientes-view')

    // WHEN the user clicks the Contactos nav item
    const contactosLink = await screen.findByTestId('nav-rail-contactos')
    fireEvent.click(contactosLink)

    // THEN the Contactos view mounts WITHOUT a full reload
    await screen.findByTestId('contactos-view')
    expect(router.state.location.pathname).toBe('/contactos')
    expect(reloadSpy).not.toHaveBeenCalled()

    // cleanup
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      writable: true,
      value: originalReload,
    })
  })

  it('TC-E1-P1-02 — deep link to /clientes renders the Clientes view directly without redirect', async () => {
    // GIVEN the router is initialised AT /clientes (simulates deep link)
    const router = buildTestRouter('/clientes')

    // WHEN it mounts
    render(<RouterProvider router={router} />)

    // THEN the Clientes view is shown and the URL stayed on /clientes
    const view = await screen.findByTestId('clientes-view')
    expect(view).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('TC-E1-P1-03 — deep link to /contactos renders the Contactos view directly without redirect', async () => {
    // GIVEN the router is initialised AT /contactos
    const router = buildTestRouter('/contactos')

    // WHEN it mounts
    render(<RouterProvider router={router} />)

    // THEN the Contactos view is shown and the URL stayed on /contactos
    const view = await screen.findByTestId('contactos-view')
    expect(view).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/contactos')
  })

  it('AC #5 — after navigating to /contactos the Contactos rail entry becomes the active item', async () => {
    // GIVEN the user starts on /clientes
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN they navigate to /contactos via the nav
    fireEvent.click(await screen.findByTestId('nav-rail-contactos'))
    await screen.findByTestId('contactos-view')

    // THEN the Contactos rail entry is marked active (aria-current="page")
    const contactosActive = await screen.findByTestId('nav-rail-contactos')
    expect(contactosActive).toHaveAttribute('aria-current', 'page')
  })
})
