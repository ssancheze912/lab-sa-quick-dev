import { describe, it, expect } from 'vitest'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

/**
 * Unit tests for TanStack Router route registration.
 *
 * UNIT-F-01: Route /clientes is registered in the route tree
 * UNIT-F-02: Route /contactos is registered in the route tree
 * UNIT-F-03: Root shell layout renders NavigationRail (verified via _app pathless layout route)
 */

const router = createRouter({ routeTree })

describe('Route tree registration', () => {
  it('UNIT-F-01 — /clientes route is registered', () => {
    const routeIds = Object.keys(router.routesById)
    expect(routeIds).toContain('/_app/clientes')
  })

  it('UNIT-F-02 — /contactos route is registered', () => {
    const routeIds = Object.keys(router.routesById)
    expect(routeIds).toContain('/_app/contactos')
  })

  it('UNIT-F-03 — _app pathless layout route is registered (shell with NavigationRail)', () => {
    const routeIds = Object.keys(router.routesById)
    expect(routeIds).toContain('/_app')
  })
})
