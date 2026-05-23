/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — 404 Not-Found View
 *
 * ATDD Acceptance Tests
 *
 * Acceptance Criteria covered:
 *   AC4 — Unknown routes display a Spanish 404 view with a link back to /clientes
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

async function renderAppAt(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history: memoryHistory })
  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 404 not-found view for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 Not-Found view for unknown routes', () => {
  it('should render the not-found view when navigating to an unknown route', async () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The router renders at /ruta-que-no-existe
    await renderAppAt('/ruta-que-no-existe')

    // THEN: The not-found view container is in the DOM
    await waitFor(() => {
      const notFoundViews = screen.getAllByTestId('not-found-view')
      expect(notFoundViews.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should display Spanish "Página no encontrada" as the heading on unknown routes', async () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The 404 view renders
    await renderAppAt('/ruta-desconocida')

    // THEN: Spanish "Página no encontrada" text is visible
    await waitFor(() => {
      const headings = screen.getAllByTestId('not-found-title')
      expect(headings.length).toBeGreaterThanOrEqual(1)
      expect(headings[0]).toHaveTextContent('Página no encontrada')
    })
  })

  it('should display a link back to /clientes on the not-found view', async () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The 404 view renders
    await renderAppAt('/ruta-desconocida')

    // THEN: A back link pointing to /clientes is present
    await waitFor(() => {
      const backLinks = screen.getAllByTestId('not-found-back-link')
      expect(backLinks.length).toBeGreaterThanOrEqual(1)
      expect(backLinks[0]).toHaveAttribute('href', '/clientes')
    })
  })

  it('should display the back link with text containing "Ir a Clientes"', async () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The 404 view renders
    await renderAppAt('/pagina-inexistente')

    // THEN: Link text references "Ir a Clientes"
    await waitFor(() => {
      const backLinks = screen.getAllByTestId('not-found-back-link')
      expect(backLinks.length).toBeGreaterThanOrEqual(1)
      expect(backLinks[0]).toHaveTextContent('Ir a Clientes')
    })
  })

  it('should NOT render the main application content on an unknown route', async () => {
    // GIVEN: An unknown route is accessed
    // WHEN: The 404 view renders
    await renderAppAt('/unknown-xyz')

    // THEN: The not-found view is shown (no normal route content)
    await waitFor(() => {
      const notFoundViews = screen.getAllByTestId('not-found-view')
      expect(notFoundViews.length).toBeGreaterThanOrEqual(1)
    })
  })
})
