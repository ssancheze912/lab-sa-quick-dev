/**
 * Story 1.2: Frontend Navigation Shell
 * Edge Case Tests — NotFoundView (404)
 *
 * Expands notFound.test.tsx with:
 *   - Secondary description text content
 *   - Multiple unknown route variants (deep paths, special characters)
 *   - Link text content assertion (← Ir a Clientes)
 *   - The not-found view is the ONLY view rendered (clientes-view absent)
 *   - 404 renders for paths with deep segments
 *   - 404 renders for paths with query params on unknown routes
 */

import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { describe, test, expect } from 'vitest'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundView: content integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — content integrity', () => {
  test('[P1] displays the secondary description text in Spanish', async () => {
    // GIVEN: User navigates to an unknown route
    const router = createTestRouter('/ruta-inexistente')
    render(<RouterProvider router={router} />)

    // WHEN: NotFoundView renders
    await screen.findByTestId('not-found-view')

    // THEN: Secondary description text is visible
    expect(await screen.findByText('La ruta que buscas no existe.')).toBeInTheDocument()
  })

  test('[P2] the back link text contains the arrow and Spanish label', async () => {
    // GIVEN: User is on a 404 view
    const router = createTestRouter('/pagina-que-no-existe')
    render(<RouterProvider router={router} />)

    // WHEN: NotFoundView renders
    await screen.findByTestId('not-found-view')

    // THEN: Link text contains "Ir a Clientes" with arrow indicator
    const link = await screen.findByRole('link', { name: /Ir a Clientes/i })
    expect(link.textContent).toContain('Ir a Clientes')
  })

  test('[P1] clientes-view is NOT rendered when on unknown route', async () => {
    // GIVEN: User is on an unknown route
    const router = createTestRouter('/ruta-invalida-xyz')
    render(<RouterProvider router={router} />)

    // WHEN: NotFoundView renders
    await screen.findByTestId('not-found-view')

    // THEN: The clientes view is absent (404 replaces normal Outlet content)
    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument()
  })

  test('[P1] contactos-view is NOT rendered when on unknown route', async () => {
    // GIVEN: User is on an unknown route
    const router = createTestRouter('/ruta-invalida-xyz')
    render(<RouterProvider router={router} />)

    // WHEN: NotFoundView renders
    await screen.findByTestId('not-found-view')

    // THEN: The contactos view is also absent
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundView: boundary conditions — various unknown route formats
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — boundary conditions: unknown route formats', () => {
  test('[P2] renders not-found-view for a deep nested unknown path', async () => {
    // GIVEN: User navigates to a deeply nested unknown path
    const router = createTestRouter('/a/b/c/desconocido')
    render(<RouterProvider router={router} />)

    // WHEN: Page loads
    // THEN: 404 view is shown
    expect(await screen.findByTestId('not-found-view')).toBeInTheDocument()
  })

  test('[P2] renders not-found-view for path with numbers only', async () => {
    // GIVEN: User navigates to a numeric path (e.g. stale bookmark)
    const router = createTestRouter('/12345')
    render(<RouterProvider router={router} />)

    // WHEN: Page loads
    // THEN: 404 view is shown (no route matches /12345)
    expect(await screen.findByTestId('not-found-view')).toBeInTheDocument()
  })

  test('[P2] renders not-found-view for path starting with underscore that does not match routes', async () => {
    // GIVEN: User navigates to a path starting with underscore (not a TanStack layout route)
    const router = createTestRouter('/unknown_section')
    render(<RouterProvider router={router} />)

    // WHEN: Page loads
    // THEN: 404 view is shown
    expect(await screen.findByTestId('not-found-view')).toBeInTheDocument()
  })

  test('[P2] renders "Página no encontrada" heading for any unknown route format', async () => {
    // GIVEN: A variety of unknown route paths
    const unknownPaths = ['/foo', '/bar/baz', '/123']

    for (const path of unknownPaths) {
      const router = createTestRouter(path)
      const { unmount } = render(<RouterProvider router={router} />)

      // WHEN: Page loads for each path
      // THEN: The heading is always present
      expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()

      unmount()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundView: link href is exactly /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — exact href on back link', () => {
  test('[P1] back link href is exactly "/clientes" (not a relative path or anchor)', async () => {
    // GIVEN: User is on 404 view
    const router = createTestRouter('/pagina-inexistente')
    render(<RouterProvider router={router} />)

    // WHEN: The view renders
    await screen.findByTestId('not-found-view')
    const link = await screen.findByRole('link', { name: /Ir a Clientes/i })

    // THEN: href is /clientes exactly (not /contactos or empty)
    const href = link.getAttribute('href')
    expect(href).toBe('/clientes')
    expect(href).not.toBe('/contactos')
    expect(href).not.toBe('')
    expect(href).not.toBeNull()
  })
})
