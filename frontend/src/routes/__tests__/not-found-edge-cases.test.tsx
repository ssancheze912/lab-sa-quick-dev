/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — 404 Not Found view edge cases & boundary conditions
 *
 * Covers cases NOT in not-found.test.tsx:
 *   - Spanish descriptive message body is present
 *   - Multiple different unknown routes all render not-found view
 *   - Deeply nested unknown paths show not-found
 *   - Not-found view renders without crashing (no JS errors via rendering)
 *   - Navigation shell (rail/bar) is still visible on 404 page
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

describe('Not Found view — Spanish descriptive body', () => {
  it('should display a descriptive Spanish message on the 404 view', async () => {
    const router = createTestRouter('/ruta-inexistente')
    await router.load()

    render(<RouterProvider router={router} />)

    // The description paragraph should contain Spanish text about the page not existing
    const notFoundView = screen.getByTestId('not-found-view')
    expect(notFoundView.textContent).toMatch(/no existe|ha sido movida|no encontrada/i)
  })
})

describe('Not Found view — multiple unknown route boundary conditions', () => {
  const unknownPaths = [
    '/ruta-inexistente',
    '/unknown',
    '/foo/bar/baz',
    '/admin',
    '/__debug__',
    '/pagina-que-no-existe',
  ]

  unknownPaths.forEach((path) => {
    it(`should render the not-found view for unknown path: ${path}`, async () => {
      const router = createTestRouter(path)
      await router.load()

      render(<RouterProvider router={router} />)

      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
  })
})

describe('Not Found view — navigation shell still present', () => {
  it('should still render the NavigationRail on the 404 page', async () => {
    const router = createTestRouter('/ruta-inexistente')
    await router.load()

    render(<RouterProvider router={router} />)

    // The root layout wraps even not-found, so the nav rail should be in the DOM
    const navRail = screen.queryByTestId('navigation-rail')
    expect(navRail).not.toBeNull()
  })

  it('should still render the NavigationBar on the 404 page', async () => {
    const router = createTestRouter('/ruta-inexistente')
    await router.load()

    render(<RouterProvider router={router} />)

    const navBar = screen.queryByTestId('navigation-bar')
    expect(navBar).not.toBeNull()
  })
})

describe('Not Found view — back-link is a valid anchor element', () => {
  it('should render the back-link as an anchor (<a>) element', async () => {
    const router = createTestRouter('/ruta-inexistente')
    await router.load()

    render(<RouterProvider router={router} />)

    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink.tagName.toLowerCase()).toBe('a')
  })

  it('should not show a blank container — not-found-view must have child content', async () => {
    const router = createTestRouter('/pagina-que-no-existe')
    await router.load()

    render(<RouterProvider router={router} />)

    const notFoundView = screen.getByTestId('not-found-view')
    expect(notFoundView.childElementCount).toBeGreaterThan(0)
  })
})
