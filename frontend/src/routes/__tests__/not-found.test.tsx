/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — 404 Not Found view
 *
 * RED Phase: These tests FAIL until implementation is complete.
 *
 * AC7 — Unknown route renders 404 view in Spanish with link back to /clientes
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRouter, createMemoryHistory } from '@tanstack/react-router'

// NOTE: routeTree.gen.ts is auto-generated. This import FAILS (RED) until
// the file-based routes are created.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — routeTree.gen.ts does not exist yet (RED phase)
import { routeTree } from '../../routeTree.gen'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('Not Found view — AC7', () => {
  it('should render the not-found view when navigating to an unknown route', () => {
    // GIVEN: The router is initialized at an unknown route
    const router = createTestRouter('/ruta-inexistente')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The page loads at the unknown route
    // THEN: The not-found view container is rendered
    // This FAILS until not-found route/component exists in TanStack Router
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
  })

  it('should display the Spanish heading "Página no encontrada" on the 404 view', () => {
    // GIVEN: The router is initialized at an unknown route
    const router = createTestRouter('/ruta-inexistente')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The not-found view renders
    // THEN: The Spanish heading is displayed
    // This FAILS until the not-found component renders the correct Spanish text
    expect(screen.getByTestId('not-found-heading')).toHaveTextContent('Página no encontrada')
  })

  it('should display a back-link element with href pointing to /clientes', () => {
    // GIVEN: The router is initialized at an unknown route
    const router = createTestRouter('/ruta-inexistente')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The not-found view renders
    // THEN: A back-link with data-testid="not-found-back-link" exists and points to /clientes
    // This FAILS until the not-found component includes <Link to="/clientes">Volver al inicio</Link>
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/clientes')
  })

  it('should display "Volver al inicio" as the back-link text', () => {
    // GIVEN: The router is initialized at an unknown route
    const router = createTestRouter('/ruta-inexistente')

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <(router as any).RouterProvider router={router} />,
    )

    // WHEN: The not-found view renders
    // THEN: The back-link has the correct Spanish label
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toHaveTextContent('Volver al inicio')
  })
})
