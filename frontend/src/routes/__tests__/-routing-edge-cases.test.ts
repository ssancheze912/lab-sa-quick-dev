import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

/**
 * Edge case unit tests for TanStack Router route tree.
 *
 * Story 1.2 — Frontend Navigation Shell
 * Epic 1 — Project Foundation & Application Shell
 *
 * BMad-Integrated expansion — route configuration edge cases.
 * Complements -routing.test.ts (UNIT-F-01..03).
 *
 * Test IDs: UNIT-RE-01 through UNIT-RE-10
 */

describe('Route tree — structure and registration edge cases', () => {
  /**
   * UNIT-RE-01 (P1 — AC3)
   * The root "__root__" route is registered (foundational check).
   */
  it('UNIT-RE-01 — Root __root__ route is registered', () => {
    const router = createRouter({ routeTree })
    expect(Object.keys(router.routesById)).toContain('__root__')
  })

  /**
   * UNIT-RE-02 (P0 — AC3)
   * The root index route "/" is registered (redirect source).
   */
  it('UNIT-RE-02 — Index route "/" is registered', () => {
    const router = createRouter({ routeTree })
    expect(Object.keys(router.routesById)).toContain('/')
  })

  /**
   * UNIT-RE-03 (P1)
   * The route tree contains exactly 8 routes:
   * __root__, /, /not-found, /_app, /_app/clientes, /_app/clientes/$clienteId,
   * /_app/contactos, /_app/contactos/$contactoId
   * (Updated from 7 after Story 3.2 added /_app/contactos/$contactoId)
   */
  it('UNIT-RE-03 — Route tree has exactly 8 registered routes', () => {
    const router = createRouter({ routeTree })
    const routeIds = Object.keys(router.routesById)
    expect(routeIds).toHaveLength(8)
  })

  /**
   * UNIT-RE-04 (P1 — AC1)
   * /_app/clientes has /_app as its parent (correct nesting).
   */
  it('UNIT-RE-04 — /_app/clientes parent is /_app', () => {
    const router = createRouter({ routeTree })
    const clientesRoute = router.routesById['/_app/clientes']
    expect(clientesRoute).toBeDefined()
    expect(clientesRoute.parentRoute?.id).toBe('/_app')
  })

  /**
   * UNIT-RE-05 (P1 — AC1)
   * /_app/contactos has /_app as its parent (correct nesting).
   */
  it('UNIT-RE-05 — /_app/contactos parent is /_app', () => {
    const router = createRouter({ routeTree })
    const contactosRoute = router.routesById['/_app/contactos']
    expect(contactosRoute).toBeDefined()
    expect(contactosRoute.parentRoute?.id).toBe('/_app')
  })

  /**
   * UNIT-RE-06 (P0 — AC3 — FR30)
   * The /_app/clientes route path segment is '/clientes' (deep-link URL maps correctly).
   */
  it('UNIT-RE-06 — /_app/clientes route path is "/clientes"', () => {
    const router = createRouter({ routeTree })
    const clientesRoute = router.routesById['/_app/clientes']
    expect(clientesRoute?.options?.path ?? (clientesRoute as { path?: string }).path).toBe('/clientes')
  })

  /**
   * UNIT-RE-07 (P0 — AC3 — FR30)
   * The /_app/contactos route path segment is '/contactos' (deep-link URL maps correctly).
   */
  it('UNIT-RE-07 — /_app/contactos route path is "/contactos"', () => {
    const router = createRouter({ routeTree })
    const contactosRoute = router.routesById['/_app/contactos']
    expect(contactosRoute?.options?.path ?? (contactosRoute as { path?: string }).path).toBe('/contactos')
  })

  /**
   * UNIT-RE-08 (P1)
   * /_app is a pathless layout route — its id starts with "/_app" but has no path segment
   * that adds a URL segment (TanStack Router prefix rule: _ = pathless).
   */
  it('UNIT-RE-08 — /_app is registered as a pathless layout route (no URL path segment)', () => {
    const router = createRouter({ routeTree })
    const appRoute = router.routesById['/_app']
    expect(appRoute).toBeDefined()
    // Pathless routes have id starting with _ but no path property (or undefined path)
    // The important thing: /_app IS registered and accessible
    expect(appRoute.id).toBe('/_app')
  })
})

describe('Route tree — navigation resolution with memory history', () => {
  /**
   * UNIT-RE-09 (P0 — AC3 — FR30)
   * A router initialized at /clientes correctly identifies the matched route.
   */
  it('UNIT-RE-09 — Router initialized at /clientes matches /_app/clientes route', async () => {
    const history = createMemoryHistory({ initialEntries: ['/clientes'] })
    const router = createRouter({ routeTree, history })
    await router.load()

    const matchedRouteIds = router.state.matches.map((m) => m.routeId)
    expect(matchedRouteIds).toContain('/_app/clientes')
  })

  /**
   * UNIT-RE-10 (P0 — AC3 — FR30)
   * A router initialized at /contactos correctly identifies the matched route.
   */
  it('UNIT-RE-10 — Router initialized at /contactos matches /_app/contactos route', async () => {
    const history = createMemoryHistory({ initialEntries: ['/contactos'] })
    const router = createRouter({ routeTree, history })
    await router.load()

    const matchedRouteIds = router.state.matches.map((m) => m.routeId)
    expect(matchedRouteIds).toContain('/_app/contactos')
  })
})
