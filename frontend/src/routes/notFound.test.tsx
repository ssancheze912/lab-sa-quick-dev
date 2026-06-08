/**
 * Story 1.2: Frontend Navigation Shell — Task 5
 *
 * Vitest + RTL test for the catch-all NotFound route registered in __root.tsx.
 *
 * Acceptance Criteria covered:
 *   AC #4 — Unknown route renders the 404 view inside the persistent shell,
 *           with a Spanish heading and a CTA back to /clientes.
 *   AC #7 — Spanish copy on the NotFound view (heading, description, CTA).
 *
 * Test case owned: TC-E1-P1-04 — 404 Route — Unknown URL Shows Not-Found View.
 *
 * RED-phase status: AppShell.tsx, NotFoundView.tsx and notFoundComponent
 * registration in __root.tsx all do NOT exist yet → this test will fail.
 */

import { describe, expect, it, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
// RED: AppShell + NotFoundView do not exist yet — imports will fail until Tasks 2 & 4 land.
import { AppShell } from '@/shared/components/AppShell'
import { NotFoundView } from '@/shared/components/NotFoundView'

afterEach(() => {
  cleanup()
})

function renderRouterAt(path: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
    notFoundComponent: () => (
      <AppShell>
        <NotFoundView />
      </AppShell>
    ),
  })

  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-view">Clientes</div>,
  })

  const routeTree = rootRoute.addChildren([clientesRoute])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  return render(<RouterProvider router={router} />)
}

describe('NotFound route — TC-E1-P1-04 (AC #4)', () => {
  it('renders the NotFoundView for an unknown path', async () => {
    // GIVEN: a router whose initialLocation points at an unknown route
    // WHEN: the router resolves
    renderRouterAt('/ruta-inexistente')

    // THEN: the NotFoundView is rendered (asynchronously after route resolution)
    expect(await screen.findByTestId('not-found-view')).toBeInTheDocument()
  })

  it('renders the NotFoundView inside the persistent shell (AC #4)', async () => {
    // GIVEN: an unknown route
    renderRouterAt('/otra-ruta-inexistente')

    // WHEN: the not-found component resolves
    await screen.findByTestId('not-found-view')

    // THEN: either the desktop or the mobile shell wrapper is present
    //       (jsdom doesn't apply Tailwind responsive classes, so we accept either)
    const desktopWrapper = screen.queryByTestId('app-shell-desktop')
    const mobileWrapper = screen.queryByTestId('app-shell-mobile')
    expect(desktopWrapper ?? mobileWrapper).not.toBeNull()
  })

  it('shows the Spanish heading "Página no encontrada" (AC #7)', async () => {
    // GIVEN: an unknown route
    renderRouterAt('/no-existe')

    // WHEN: the NotFoundView renders
    await screen.findByTestId('not-found-view')

    // THEN: the Spanish heading is present
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()
  })

  it('renders a CTA link to /clientes labeled "Ir a Clientes" (AC #4, #7)', async () => {
    // GIVEN: an unknown route
    renderRouterAt('/algo-no-mapeado')

    // WHEN: the NotFoundView renders
    await screen.findByTestId('not-found-view')

    // THEN: a link to /clientes with the Spanish label is present
    const link = screen.getByRole('link', { name: 'Ir a Clientes' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/clientes')
  })
})
