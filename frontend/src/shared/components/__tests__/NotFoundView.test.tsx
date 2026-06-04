/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests (Vitest + RTL) — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC6 — Unknown routes display 404 view in Spanish with /clientes link
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render the application at an unknown/404 route
// ─────────────────────────────────────────────────────────────────────────────

function renderAtUnknownRoute(path: string = '/ruta-inexistente') {
  const history = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history })
  render(<RouterProvider router={router} />)
  return router
}

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — 404 not-found view for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — NotFoundView for unknown routes', () => {
  it('should display the not-found view container for an unknown route', () => {
    // GIVEN: The user navigates to an unknown route
    renderAtUnknownRoute('/ruta-inexistente')

    // THEN: The 404 not-found view container is rendered
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
  })

  it('should display the heading "Página no encontrada" in Spanish', () => {
    // GIVEN: The user is on an unknown route
    renderAtUnknownRoute('/ruta-inexistente')

    // THEN: The heading is visible and says "Página no encontrada" in Spanish
    expect(screen.getByTestId('not-found-heading')).toBeInTheDocument()
    expect(screen.getByTestId('not-found-heading')).toHaveTextContent('Página no encontrada')
  })

  it('should render the heading as an H1 element', () => {
    // GIVEN: The user is on the 404 not-found page
    renderAtUnknownRoute('/ruta-inexistente')

    // THEN: The heading element is an H1 (semantically correct)
    expect(screen.getByRole('heading', { level: 1, name: /página no encontrada/i })).toBeInTheDocument()
  })

  it('should display a descriptive paragraph in Spanish', () => {
    // GIVEN: The user is on the 404 not-found page
    renderAtUnknownRoute('/ruta-inexistente')

    // THEN: A descriptive paragraph in Spanish is visible below the heading
    // The implementation must include a <p> element with a description in Spanish
    const view = screen.getByTestId('not-found-view')
    expect(view.querySelector('p')).not.toBeNull()
  })

  it('should display a link to /clientes from the 404 view', () => {
    // GIVEN: The user is on the 404 not-found page
    renderAtUnknownRoute('/ruta-inexistente')

    // THEN: A link back to /clientes is visible
    expect(screen.getByTestId('not-found-back-link')).toBeInTheDocument()
  })

  it('should have href="/clientes" on the return link', () => {
    // GIVEN: The user is on the 404 not-found page
    renderAtUnknownRoute('/ruta-inexistente')

    // THEN: The return link points to /clientes
    expect(screen.getByTestId('not-found-back-link')).toHaveAttribute('href', '/clientes')
  })

  it('should show a human-readable CTA text on the return link', () => {
    // GIVEN: The user is on the 404 not-found page
    renderAtUnknownRoute('/ruta-inexistente')

    // THEN: The CTA link has meaningful Spanish text (e.g., "Ir a Clientes")
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink.textContent?.length).toBeGreaterThan(0)
  })

  it('should navigate to /clientes when the return link is clicked', async () => {
    // GIVEN: The user is on the 404 not-found page
    const router = renderAtUnknownRoute('/ruta-inexistente')

    // WHEN: The user clicks the back-to-clientes link
    await userEvent.click(screen.getByTestId('not-found-back-link'))

    // THEN: The router navigates to /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })
})
