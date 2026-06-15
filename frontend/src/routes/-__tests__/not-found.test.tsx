/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Test — RED Phase (Vitest + React Testing Library)
 *
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Covers Acceptance Criteria:
 *   AC #5 — Unknown route shows a not-found view while keeping the shell visible.
 *
 * Test Case mapped:
 *   TC-E1-P1-04 — Render router at /ruta-que-no-existe: NotFoundView displayed
 *                 AND the navigation shell (NavigationRail OR NavigationBar) remains
 *                 in the DOM.
 */

import { describe, expect, test, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { routeTree } from '@/routeTree.gen'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'

function setDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', {
    value: 1280,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('1024'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
  window.dispatchEvent(new Event('resize'))
}

describe('Not-Found view — unknown route (AC #5, TC-E1-P1-04)', () => {
  beforeEach(() => {
    setDesktopViewport()
  })

  afterEach(() => {
    cleanup()
  })

  test('GIVEN user navigates to /ruta-que-no-existe WHEN the page loads THEN the NotFoundView component is rendered', async () => {
    // GIVEN: A router with the app routeTree and a memory history pointing to an unknown route
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/ruta-que-no-existe'] }),
    })

    // WHEN: The app renders
    render(<RouterProvider router={router} />)

    // THEN: The not-found view is in the DOM
    const notFound = await screen.findByTestId('not-found-view')
    expect(notFound).toBeInTheDocument()
  })

  test('GIVEN user navigates to an unknown route WHEN the page loads THEN the Spanish "Página no encontrada" heading is displayed', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/ruta-que-no-existe'] }),
    })

    render(<RouterProvider router={router} />)

    // THEN: The Spanish heading is shown
    expect(
      await screen.findByRole('heading', { name: /página no encontrada/i }),
    ).toBeInTheDocument()
  })

  test('GIVEN the not-found view is rendered WHEN the user inspects the page THEN a link back to /clientes is exposed', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/ruta-que-no-existe'] }),
    })

    render(<RouterProvider router={router} />)

    // THEN: A link to /clientes is present (Spanish label per Dev Notes: "Ir a Clientes")
    const link = await screen.findByTestId('not-found-link-clientes')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/clientes')
  })

  test('GIVEN user navigates to an unknown route WHEN the not-found view renders THEN the navigation shell remains visible', async () => {
    // AC #5 — "the navigation shell (NavigationRail/NavigationBar + Navbar) remains visible"
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/ruta-que-no-existe'] }),
    })

    render(<RouterProvider router={router} />)

    // Wait for the not-found view to commit (TanStack Router resolves matches
    // asynchronously). Once committed, the surrounding AppShell is guaranteed
    // mounted because the not-found component is rendered as a child of the
    // root route component.
    await screen.findByTestId('not-found-view')

    // THEN: At least one of the shell navigation containers is present in the DOM
    const rail = screen.queryByTestId('app-navigation-rail')
    const bar = screen.queryByTestId('app-navigation-bar')

    // The shell must remain mounted while the inner content area shows the not-found view.
    expect(rail || bar).not.toBeNull()
  })
})
