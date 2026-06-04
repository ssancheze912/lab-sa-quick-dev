/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * NotFoundView Tests (Vitest + RTL)
 *
 * Acceptance Criteria covered:
 *   AC6 — 404 / not-found view is displayed gracefully with a message in Spanish
 *          and a link to return to /clientes
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../../routeTree.gen'

async function renderNotFound() {
  const history = createMemoryHistory({ initialEntries: ['/ruta-inexistente'] })
  const router = createRouter({ routeTree, history })
  render(<RouterProvider router={router} />)
  await router.load()
  return router
}

describe('NotFoundView — AC6', () => {
  it('should display "Página no encontrada" heading on unknown routes', async () => {
    // GIVEN: The user navigates to an unknown route
    await renderNotFound()

    // THEN: The 404 heading is visible in Spanish
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Página no encontrada', level: 1 }),
      ).toBeInTheDocument()
    })
  })

  it('should display a link to /clientes on the 404 page', async () => {
    // GIVEN: The 404 view is rendered
    await renderNotFound()

    // THEN: A link labeled "Ir a Clientes" exists and points to /clientes
    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Ir a Clientes' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/clientes')
    })
  })
})
