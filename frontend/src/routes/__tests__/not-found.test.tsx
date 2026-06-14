/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — 404 Not Found view
 *
 * AC7 — Unknown route renders 404 view in Spanish with link back to /clientes
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('Not Found view — AC7', () => {
  it('should render the not-found view when navigating to an unknown route', async () => {
    const router = createTestRouter('/ruta-inexistente')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
  })

  it('should display the Spanish heading "Página no encontrada" on the 404 view', async () => {
    const router = createTestRouter('/ruta-inexistente')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('not-found-heading')).toHaveTextContent('Página no encontrada')
  })

  it('should display a back-link element with href pointing to /clientes', async () => {
    const router = createTestRouter('/ruta-inexistente')
    await router.load()

    render(<RouterProvider router={router} />)

    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/clientes')
  })

  it('should display "Volver al inicio" as the back-link text', async () => {
    const router = createTestRouter('/ruta-inexistente')
    await router.load()

    render(<RouterProvider router={router} />)

    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toHaveTextContent('Volver al inicio')
  })
})
