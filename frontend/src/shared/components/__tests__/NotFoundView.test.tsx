/**
 * Story 1.2: Frontend Navigation Shell — Expanded Coverage (testarch-automate)
 *
 * Component edge-case tests for NotFoundView (P2).
 *
 * Coverage gaps addressed (beyond the routing-level not-found.test.tsx ATDD file):
 *   - Spanish body text "La ruta solicitada no existe."
 *   - aria-label on the section
 *   - Link text and href are correct
 *   - Link is an anchor element (renders as <a>) — keyboard accessibility
 *
 * Mounted in isolation (no router) since the component itself is decoupled.
 */

import { describe, expect, test, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { NotFoundView } from '@/shared/components/NotFoundView'

function renderInRouter() {
  // NotFoundView uses TanStack <Link> — needs a RouterProvider in scope.
  const rootRoute = createRootRoute({
    component: () => <NotFoundView />,
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/anything'] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('NotFoundView — content & accessibility (P2)', () => {
  afterEach(() => {
    cleanup()
  })

  test('[P2] GIVEN NotFoundView renders WHEN inspecting the body THEN Spanish "La ruta solicitada no existe." copy is shown', async () => {
    renderInRouter()
    expect(
      await screen.findByText(/la ruta solicitada no existe\./i),
    ).toBeInTheDocument()
  })

  test('[P2] GIVEN NotFoundView renders WHEN inspecting the section role THEN aria-label is "Página no encontrada"', async () => {
    renderInRouter()
    const view = await screen.findByTestId('not-found-view')
    expect(view).toHaveAttribute('aria-label', 'Página no encontrada')
  })

  test('[P2] GIVEN NotFoundView renders WHEN inspecting the action link THEN the visible label is "Ir a Clientes"', async () => {
    renderInRouter()
    const link = await screen.findByTestId('not-found-link-clientes')
    expect(link.textContent?.trim()).toBe('Ir a Clientes')
  })

  test('[P2] GIVEN NotFoundView renders WHEN inspecting the action link THEN it is a real anchor (<a>) for keyboard accessibility', async () => {
    renderInRouter()
    const link = await screen.findByTestId('not-found-link-clientes')
    // TanStack Router <Link> renders an <a> by default.
    expect(link.tagName.toLowerCase()).toBe('a')
    expect(link).toHaveAttribute('href', '/clientes')
  })

  test('[P2] GIVEN NotFoundView renders WHEN querying by accessible heading role THEN the heading level is 1 (top-level page heading)', async () => {
    renderInRouter()
    const heading = await screen.findByRole('heading', {
      name: /página no encontrada/i,
      level: 1,
    })
    expect(heading).toBeInTheDocument()
  })
})
