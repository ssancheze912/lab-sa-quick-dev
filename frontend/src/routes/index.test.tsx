/**
 * RED PHASE — Story 1.2: Frontend Navigation Shell
 * Covers TC-E1-P2-03 (Index route redirects to /clientes) and AC #6.
 *
 * MUST FAIL until `index.tsx` is changed to throw `redirect({ to: '/clientes' })`
 * in `beforeLoad`, and the `_app` shell + `_app/clientes.tsx` route exist.
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
import { Route as IndexRoute } from './index'
import { Route as AppLayoutRoute } from './_app'
import { Route as ClientesRoute } from './_app/clientes'
import { Route as ContactosRoute } from './_app/contactos'

function buildTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })

  // mirror IndexRoute's beforeLoad (redirect → /clientes) by re-binding to the test root
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: IndexRoute.options.beforeLoad,
    component: IndexRoute.options.component ?? (() => null),
  })
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
    indexRoute,
    appLayoutRoute.addChildren([clientesRoute, contactosRoute]),
  ])
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('Story 1.2 — Index route redirect (AC #6)', () => {
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

  it('TC-E1-P2-03 — landing on / redirects to /clientes', async () => {
    // GIVEN the user lands on the root path
    const router = buildTestRouter('/')

    // WHEN the router resolves
    render(<RouterProvider router={router} />)

    // THEN the URL becomes /clientes and the Clientes placeholder is rendered
    const view = await screen.findByTestId('clientes-view')
    expect(view).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('AC #6 — IndexRoute is configured with a `beforeLoad` redirect (not a runtime navigate)', () => {
    // GIVEN the IndexRoute module
    // WHEN we inspect its options
    // THEN `beforeLoad` is defined (architectural assertion — prevents flicker / double render)
    expect(IndexRoute.options.beforeLoad).toBeTypeOf('function')
  })
})
