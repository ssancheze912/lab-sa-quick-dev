/**
 * RED PHASE — Story 1.2: Frontend Navigation Shell
 * Covers TC-E1-P2-01 and TC-E1-P2-02 (NavigationRail desktop / NavigationBar mobile)
 * and AC #1, #2, #5 (siesa-ui-kit rail+bar, responsive switch, active visual state).
 *
 * These tests MUST FAIL until the `_app.tsx` pathless layout route is created.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })
  // Attach the existing AppLayoutRoute under the test root (preserve its component)
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

describe('Story 1.2 — _app.tsx Navigation Shell', () => {
  beforeEach(() => {
    // jsdom does not implement matchMedia — provide a deterministic stub per test
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

  it('TC-E1-P2-01 — renders NavigationRail and NavigationBar with Clientes and Contactos entries', async () => {
    // GIVEN a router mounted at /clientes
    const router = buildTestRouter('/clientes')

    // WHEN the shell is rendered
    render(<RouterProvider router={router} />)

    // THEN both nav landmarks expose the Clientes and Contactos entries
    // (the responsive wrappers `hidden lg:flex` / `lg:hidden` keep them both in the DOM
    //  but only one is visible per viewport; jsdom does not evaluate media queries).
    const railClientes = await screen.findByTestId('nav-rail-clientes')
    const railContactos = await screen.findByTestId('nav-rail-contactos')
    const barClientes = await screen.findByTestId('nav-bar-clientes')
    const barContactos = await screen.findByTestId('nav-bar-contactos')

    expect(railClientes).toHaveTextContent('Clientes')
    expect(railContactos).toHaveTextContent('Contactos')
    expect(barClientes).toHaveTextContent('Clientes')
    expect(barContactos).toHaveTextContent('Contactos')
  })

  it('TC-E1-P2-01 (cont.) — desktop NavigationRail wrapper has responsive class `lg:flex` (visible from lg up)', async () => {
    // GIVEN the shell is rendered
    const router = buildTestRouter('/clientes')

    // WHEN we query the rail wrapper
    render(<RouterProvider router={router} />)
    const railWrapper = await screen.findByTestId('navigation-rail-wrapper')

    // THEN it carries the mobile-first responsive utility classes
    expect(railWrapper.className).toMatch(/hidden/)
    expect(railWrapper.className).toMatch(/lg:flex|lg:block/)
  })

  it('TC-E1-P2-02 — mobile NavigationBar wrapper has responsive class `lg:hidden` (hidden from lg up)', async () => {
    // GIVEN the shell is rendered
    const router = buildTestRouter('/clientes')

    // WHEN we query the bar wrapper
    render(<RouterProvider router={router} />)
    const barWrapper = await screen.findByTestId('navigation-bar-wrapper')

    // THEN it is the mobile-only landmark
    expect(barWrapper.className).toMatch(/lg:hidden/)
  })

  it('AC #5 — when the active route is /clientes the Clientes nav item is marked active (aria-current="page")', async () => {
    // GIVEN the router lands on /clientes
    const router = buildTestRouter('/clientes')

    // WHEN the shell renders
    render(<RouterProvider router={router} />)

    // THEN the rail Clientes link reports aria-current=page (TanStack Router activeProps)
    const clientesActive = await screen.findByTestId('nav-rail-clientes')
    expect(clientesActive).toHaveAttribute('aria-current', 'page')

    // AND Contactos is NOT active
    const contactosInactive = await screen.findByTestId('nav-rail-contactos')
    expect(contactosInactive).not.toHaveAttribute('aria-current', 'page')
  })

  it('AC #2 / accessibility — the shell exposes a navigation landmark with Spanish aria-label', async () => {
    // GIVEN the shell is rendered
    const router = buildTestRouter('/clientes')

    // WHEN we look for the main nav landmark
    render(<RouterProvider router={router} />)

    // THEN at least one landmark labelled "Navegación principal" exists
    const nav = await screen.findByRole('navigation', { name: /navegación principal/i })
    expect(nav).toBeInTheDocument()
  })

  it('AC #3 — shell renders the Clientes view (Outlet mounts child route) at /clientes', async () => {
    // GIVEN deep-link entry at /clientes
    const router = buildTestRouter('/clientes')

    // WHEN the router mounts
    render(<RouterProvider router={router} />)

    // THEN the placeholder Clientes view is mounted inside the shell
    const view = await screen.findByTestId('clientes-view')
    expect(view).toBeInTheDocument()
  })
})
