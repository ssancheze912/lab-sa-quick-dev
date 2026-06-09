/**
 * RED PHASE — Story 1.2: Frontend Navigation Shell
 * Covers TC-E1-P1-04 (404 / not-found view on unknown route) and AC #4.
 *
 * MUST FAIL until `__root.tsx` registers a `notFoundComponent` that renders the
 * Spanish 404 view inside the `_app` shell.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { Route as IndexRoute } from './index'
import { Route as AppLayoutRoute } from './_app'
import { Route as ClientesRoute } from './_app/clientes'
import { Route as ContactosRoute } from './_app/contactos'

function buildRealRouter(initialPath: string) {
  const rootRoute = RootRoute
  IndexRoute.parentRoute = rootRoute
  AppLayoutRoute.parentRoute = rootRoute
  ClientesRoute.parentRoute = AppLayoutRoute
  ContactosRoute.parentRoute = AppLayoutRoute
  const routeTree = rootRoute.addChildren([
    IndexRoute,
    AppLayoutRoute.addChildren([ClientesRoute, ContactosRoute]),
  ])
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('Story 1.2 — __root.tsx 404 / not-found behaviour (AC #4)', () => {
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

  it('AC #4 — __root.tsx registers a notFoundComponent', () => {
    // GIVEN the root route module
    // WHEN we inspect its options
    // THEN a notFoundComponent is configured (otherwise the framework renders a default English fallback)
    expect(RootRoute.options.notFoundComponent).toBeTypeOf('function')
  })

  it('TC-E1-P1-04 — navigating to an unknown route renders the Spanish "Página no encontrada" view', async () => {
    // GIVEN the router is initialised at an unknown path
    const router = buildRealRouter('/no-existe')

    // WHEN it mounts
    render(<RouterProvider router={router} />)

    // THEN the Spanish 404 heading is rendered
    const heading = await screen.findByRole('heading', { name: /página no encontrada/i })
    expect(heading).toBeInTheDocument()
  })

  it('AC #4 — the 404 view exposes a Spanish CTA "Ir a Clientes" linking to /clientes', async () => {
    // GIVEN the router is initialised at an unknown path
    const router = buildRealRouter('/ruta-invalida')

    // WHEN it mounts
    render(<RouterProvider router={router} />)

    // THEN a link with the Spanish CTA exists
    const cta = await screen.findByRole('link', { name: /ir a clientes/i })
    expect(cta).toBeInTheDocument()
  })

  it('AC #4 — the navigation shell remains visible on the 404 view', async () => {
    // GIVEN the router is initialised at an unknown path
    const router = buildRealRouter('/foobar')

    // WHEN it mounts
    render(<RouterProvider router={router} />)

    // THEN the navigation landmark is still in the DOM (shell wraps the 404)
    const nav = await screen.findByRole('navigation', { name: /navegación principal/i })
    expect(nav).toBeInTheDocument()
  })
})
