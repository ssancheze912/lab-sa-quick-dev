/**
 * Story 1.2 — Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Tests — RED Phase (intentionally failing until implementation lands)
 *
 * Covers test-design IDs:
 *   - TC-E1-P1-01 — SPA navigation, no full reload (AC #1, #7)
 *   - TC-E1-P1-04 — 404 / NotFoundView rendered inside the shell (AC #5)
 *   - TC-E1-P2-03 — `/` redirects to `/clientes` (AC #6)
 *   - Active state derived from TanStack Router pathname (AC #7)
 *
 * Selector strategy: data-testid > ARIA > role. No CSS selectors, no hard waits.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'

import { AppShell } from './AppShell'
import { NotFoundView } from '../../shared/components/NotFoundView'

/**
 * Builds an isolated in-memory TanStack Router instance for tests.
 *
 * GIVEN the implementation has wired AppShell + index redirect + notFoundComponent in src/routes,
 * this helper mirrors that structure (root wraps everything in AppShell, `/` redirects to
 * `/clientes`, `/clientes` + `/contactos` render placeholder views, unknown routes hit the root
 * notFoundComponent). Using an in-memory history lets us drive deep-link scenarios deterministically.
 */
function buildTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
    notFoundComponent: NotFoundView,
  })

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => {
      throw redirect({ to: '/clientes' })
    },
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

  const routeTree = rootRoute.addChildren([indexRoute, clientesRoute, contactosRoute])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('AppShell — SPA navigation and routing (Story 1.2)', () => {
  beforeEach(() => {
    // GIVEN: a desktop viewport so the NavigationRailGroup is the active navigation surface
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('TC-E1-P1-01 — navigates from "/" → "/clientes" via the rail without a full page reload', async () => {
    // GIVEN: the shell is mounted at "/clientes" and window.location.reload is spied
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy, assign: vi.fn(), replace: vi.fn() },
    })

    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    const shellBefore = screen.getByTestId('app-root')

    // WHEN: the user clicks the "Contactos" navigation entry
    const contactosNav = await screen.findByRole('button', { name: /ir a contactos/i })
    await act(async () => {
      fireEvent.click(contactosNav)
    })

    // THEN: the router pathname switches to "/contactos" with no full reload, shell stays mounted
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
    expect(reloadSpy).not.toHaveBeenCalled()
    expect(screen.getByTestId('app-root')).toBe(shellBefore)
  })

  it('TC-E1-P1-01 — active item reflects current pathname (Clientes active on /clientes)', async () => {
    // GIVEN: the router starts at /clientes
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // WHEN: the shell renders
    const clientesNav = await screen.findByRole('button', { name: /ir a clientes/i })

    // THEN: the "Clientes" nav entry is the active one. Implementation may expose this as
    // aria-current="page" OR data-active="true" (whichever siesa-ui-kit emits). Accept either.
    await waitFor(() => {
      const ariaCurrent = clientesNav.getAttribute('aria-current')
      const dataActive = clientesNav.getAttribute('data-active')
      expect(ariaCurrent === 'page' || dataActive === 'true').toBe(true)
    })
  })

  it('TC-E1-P1-01 — active item reflects current pathname (Contactos active on /contactos)', async () => {
    // GIVEN: the router starts at /contactos
    const router = buildTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    // WHEN: the shell renders
    const contactosNav = await screen.findByRole('button', { name: /ir a contactos/i })

    // THEN: the "Contactos" entry is active
    await waitFor(() => {
      const ariaCurrent = contactosNav.getAttribute('aria-current')
      const dataActive = contactosNav.getAttribute('data-active')
      expect(ariaCurrent === 'page' || dataActive === 'true').toBe(true)
    })
  })

  it('TC-E1-P2-03 — "/" redirects to "/clientes" via TanStack Router (no window.location)', async () => {
    // GIVEN: the router starts at "/"
    const router = buildTestRouter('/')
    render(<RouterProvider router={router} />)

    // WHEN: the router resolves the index route's beforeLoad redirect
    // THEN: final pathname is /clientes and the Clientes view renders
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })

  it('TC-E1-P1-04 — unknown route renders NotFoundView inside the AppShell layout', async () => {
    // GIVEN: the router starts at an unknown path
    const router = buildTestRouter('/ruta-que-no-existe')
    render(<RouterProvider router={router} />)

    // WHEN: the router resolves the not-found component
    // THEN: NotFoundView is rendered AND the AppShell is still mounted (shell wraps 404)
    await waitFor(() => {
      expect(screen.getByText(/página no encontrada/i)).toBeInTheDocument()
    })
    expect(screen.getByTestId('app-root')).toBeInTheDocument()
  })

  it('TC-E1-P1-04 — NotFoundView exposes a Spanish "Ir a Clientes" link back to /clientes', async () => {
    // GIVEN: the router is on an unknown path
    const router = buildTestRouter('/ruta-que-no-existe')
    render(<RouterProvider router={router} />)

    // WHEN: the user clicks the "Ir a Clientes" recovery link
    const irAClientes = await screen.findByRole('link', { name: /ir a clientes/i })
    await act(async () => {
      fireEvent.click(irAClientes)
    })

    // THEN: the router navigates back to /clientes via SPA navigation
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('navigation items expose Spanish aria-labels for WCAG 2.1 AA (AC #8)', async () => {
    // GIVEN: the shell is mounted
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // THEN: both nav entries expose the required Spanish aria-labels
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ir a Clientes' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Ir a Contactos' })).toBeInTheDocument()
  })

  it('renders productName "Siesa Agents" on the LayoutBase navbar (AC #1)', async () => {
    // GIVEN: the shell is mounted at /clientes on desktop
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // THEN: the product name is visible somewhere in the shell chrome
    await waitFor(() => {
      expect(screen.getByText(/siesa agents/i)).toBeInTheDocument()
    })
  })
})
