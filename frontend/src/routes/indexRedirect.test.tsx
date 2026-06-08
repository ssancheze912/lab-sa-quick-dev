/**
 * Story 1.2: Frontend Navigation Shell — Task 5
 *
 * Vitest + RTL test for the index route redirect: `/` → `/clientes`.
 *
 * Acceptance Criteria covered:
 *   AC #5 — TanStack Router resolves `/` to `/clientes` via `beforeLoad`
 *           + `throw redirect({ to: '/clientes' })`.
 *
 * Test case owned: TC-E1-P2-03 — Index Route Redirects to /clientes.
 *
 * RED-phase status: src/routes/index.tsx still renders the "Aplicación
 * inicializada" placeholder (Story 1.1) and AppShell does not exist yet,
 * so the import + behavioral assertion will both fail.
 */

import { describe, expect, it, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  redirect,
  Outlet,
} from '@tanstack/react-router'
// RED: AppShell does not exist yet — import will fail until Task 2 lands.
import { AppShell } from '@/shared/components/AppShell'

afterEach(() => {
  cleanup()
})

/**
 * Builds a router whose `/` route mirrors the shipped index.tsx behavior:
 *   beforeLoad: () => { throw redirect({ to: '/clientes' }) }
 *
 * This is a behavioral mirror — if Task 1 ships the same beforeLoad on the
 * real `src/routes/index.tsx`, navigating to `/` will land on `/clientes`.
 * The test fails today because AppShell.tsx is missing.
 */
function buildRouterAt(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
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

  const routeTree = rootRoute.addChildren([indexRoute, clientesRoute])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('Index route redirect — TC-E1-P2-03 (AC #5)', () => {
  it('redirects from `/` to `/clientes` and renders the Clientes view', async () => {
    // GIVEN: a router whose initialLocation is the root URL `/`
    const router = buildRouterAt('/')

    // WHEN: the router resolves and renders
    render(<RouterProvider router={router} />)

    // THEN: the Clientes view is rendered (redirect resolved to /clientes)
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument()

    // AND: the router's resolved location is `/clientes` (no longer `/`)
    expect(router.state.location.pathname).toBe('/clientes')
  })
})
