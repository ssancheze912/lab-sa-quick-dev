/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — 404 Not-Found View
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC4 — Unknown routes display a Spanish 404 view with a link back to /clientes
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderAppAt(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history: memoryHistory })
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 not-found view for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 Not-Found view for unknown routes', () => {
  it('should render the not-found view when navigating to an unknown route', () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The router renders at /ruta-que-no-existe
    renderAppAt('/ruta-que-no-existe')

    // THEN: The not-found view container is in the DOM
    const notFoundView = screen.getByTestId('not-found-view')
    expect(notFoundView).toBeInTheDocument()
  })

  it('should display Spanish "Página no encontrada" as the heading on unknown routes', () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The 404 view renders
    renderAppAt('/ruta-desconocida')

    // THEN: Spanish "Página no encontrada" text is visible
    const heading = screen.getByTestId('not-found-title')
    expect(heading).toHaveTextContent('Página no encontrada')
  })

  it('should display a link back to /clientes on the not-found view', () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The 404 view renders
    renderAppAt('/ruta-desconocida')

    // THEN: A back link pointing to /clientes is present
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/clientes')
  })

  it('should display the back link with text containing "Ir a Clientes"', () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The 404 view renders
    renderAppAt('/pagina-inexistente')

    // THEN: Link text references "Ir a Clientes"
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toHaveTextContent('Ir a Clientes')
  })

  it('should NOT render the main application content on an unknown route', () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The 404 view renders
    renderAppAt('/unknown-xyz')

    // THEN: The not-found view is shown (no normal route content)
    const notFoundView = screen.getByTestId('not-found-view')
    expect(notFoundView).toBeVisible()
  })
})
