/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case Tests — Navigation shell rendering on 404 route
 * Split from root-edge-cases.test.tsx to comply with 300-line file limit.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

async function renderAtRoute(path: string) {
  const router = createTestRouter(path)
  render(<RouterProvider router={router} />)
  await router.load()
  return router
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell renders correctly for 404 route
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation shell — renders on 404 route', () => {
  beforeEach(() => setViewportWidth(1280))

  it('should render the navigation shell (NavigationRail) on unknown routes', async () => {
    // GIVEN: User navigates to an unknown path
    await renderAtRoute('/ruta-inexistente')

    // THEN: The navigation shell (desktop) is still rendered
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })
  })

  it('should have both nav links accessible on the 404 page', async () => {
    // GIVEN: User is on a 404 page
    await renderAtRoute('/ruta-inexistente')

    // THEN: Both Clientes and Contactos nav links are present in the nav shell
    await waitFor(() => {
      expect(screen.getByTestId('nav-link-clientes')).toBeInTheDocument()
      expect(screen.getByTestId('nav-link-contactos')).toBeInTheDocument()
    })
  })

  it('should show neither Clientes nor Contactos as active on a 404 route', async () => {
    // GIVEN: User is on an unknown route (no nav entry matches)
    await renderAtRoute('/ruta-inexistente')

    // THEN: No nav link has aria-current="page"
    await waitFor(() => {
      expect(screen.getByTestId('nav-link-clientes')).not.toHaveAttribute('aria-current')
      expect(screen.getByTestId('nav-link-contactos')).not.toHaveAttribute('aria-current')
    })
  })
})
