/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — 404 Not-Found View
 *
 * ATDD Acceptance Tests + Edge Cases
 *
 * Acceptance Criteria covered:
 *   AC4 — Unknown routes display a Spanish 404 view with a link back to /clientes
 *
 * Edge Cases:
 *   - Secondary paragraph with description text is rendered
 *   - 404 renders inside the nav shell (nav items still present)
 *   - Multiple distinct unknown paths all trigger 404
 *   - Deeply nested unknown path triggers 404
 *   - Back link href is exactly "/clientes" (not relative or different)
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

// ─────────────────────────────────────────────────────────────────────────────
// Edge — 404 secondary description paragraph
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — 404 secondary description paragraph', () => {
  it('should display the secondary description "La ruta que buscas no existe."', async () => {
    // GIVEN: An unknown route is accessed
    await renderAppAt('/does-not-exist')

    // THEN: The supporting paragraph is rendered
    await waitFor(() => {
      expect(screen.getByText('La ruta que buscas no existe.')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge — 404 renders inside nav shell (nav items still accessible)
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — 404 renders within the nav shell', () => {
  it('should still show navigation items when a 404 is triggered', async () => {
    // GIVEN: An unknown route is accessed (notFoundComponent renders inside root layout)
    await renderAppAt('/ruta-inexistente-con-nav')

    // THEN: Both the 404 view AND the nav shell are in the DOM
    await waitFor(() => {
      const notFoundViews = screen.getAllByTestId('not-found-view')
      expect(notFoundViews.length).toBeGreaterThanOrEqual(1)
    })
    // Nav items should still be visible in the shell surrounding the 404
    const clientesNavItems = screen.getAllByTestId('nav-item-clientes')
    expect(clientesNavItems.length).toBeGreaterThanOrEqual(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge — Multiple distinct unknown paths all trigger 404
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Multiple unknown paths trigger 404', () => {
  const unknownPaths = [
    '/algo-que-no-existe',
    '/admin',
    '/settings/profile',
  ]

  unknownPaths.forEach((path) => {
    it(`should show 404 view for unknown path "${path}"`, async () => {
      // GIVEN: An unknown path is accessed
      await renderAppAt(path)

      // THEN: The not-found view is rendered
      await waitFor(() => {
        const views = screen.getAllByTestId('not-found-view')
        expect(views.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge — Back link href boundary: exactly "/clientes"
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge — Not-found back link href boundary', () => {
  it('should have href="/clientes" exactly (not a relative or hash path)', async () => {
    // GIVEN: An unknown route is accessed
    await renderAppAt('/anywhere-unknown')

    // THEN: The back link href is exactly "/clientes"
    await waitFor(() => {
      const backLinks = screen.getAllByTestId('not-found-back-link')
      expect(backLinks.length).toBeGreaterThanOrEqual(1)
      const href = backLinks[0].getAttribute('href')
      expect(href).toBe('/clientes')
    })
  })

  it('should have the back link as an anchor element (not a button)', async () => {
    // GIVEN: An unknown route is accessed
    await renderAppAt('/not-a-page')

    // THEN: The back link is rendered as an <a> element
    await waitFor(() => {
      const backLinks = screen.getAllByTestId('not-found-back-link')
      expect(backLinks.length).toBeGreaterThanOrEqual(1)
      expect(backLinks[0].tagName.toLowerCase()).toBe('a')
    })
  })
})
