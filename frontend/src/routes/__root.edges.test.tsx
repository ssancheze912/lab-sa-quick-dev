/**
 * Story 1.2: Frontend Navigation Shell — EXPANDED COVERAGE
 * Epic 1: Project Foundation & Application Shell
 *
 * Test Expansion (testarch-automate) — edges and negative paths
 * Builds on top of the ATDD baseline in `__root.test.tsx`.
 *
 * Coverage focus (NOT duplicated with ATDD):
 *   - AC #1 / #2 edges: exactly-at-breakpoint behavior (1024px, 1023px), aria-labels
 *     for accessibility, both nav surfaces never visible simultaneously.
 *   - AC #2 edge: NavigationBar items expose accessible labels for screen readers
 *     and tappable target requirements (data-testid + aria-label present).
 *   - AC #6 edge: no active item flagged when the route is unknown (404 case).
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

function setViewport(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })

  const mql = (query: string): MediaQueryList => {
    const matches = /min-width:\s*1024px/.test(query) ? width >= 1024 : width < 1024
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(mql),
  })

  window.dispatchEvent(new Event('resize'))
}

function renderShellAt(path: string = '/clientes') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('Shell layout edges — __root.tsx (Story 1.2 / AC #1, #2, #6 — edges)', () => {
  beforeEach(() => {
    setViewport(1280)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Responsive breakpoint boundary — lg: 1024px', () => {
    test('[P2] should render the NavigationRail exactly at the lg breakpoint (1024px)', async () => {
      // GIVEN: viewport is exactly 1024px (`min-width: 1024px` matches)
      setViewport(1024)

      // WHEN: shell renders
      renderShellAt('/clientes')

      // THEN: rail is in DOM, bar is not
      expect(await screen.findByTestId('navigation-rail')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
    })

    test('[P2] should render the NavigationBar one pixel below the lg breakpoint (1023px)', async () => {
      // GIVEN: viewport is 1023px — strictly below lg:
      setViewport(1023)

      // WHEN: shell renders
      renderShellAt('/clientes')

      // THEN: bar is in DOM, rail is not
      expect(await screen.findByTestId('navigation-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
    })

    test('[P1] should never render both NavigationRail and NavigationBar at the same time on desktop', async () => {
      // GIVEN: desktop viewport
      setViewport(1280)

      // WHEN: shell renders
      renderShellAt('/clientes')

      // THEN: only the rail exists in the DOM
      await screen.findByTestId('navigation-rail')
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
    })

    test('[P1] should never render both NavigationRail and NavigationBar at the same time on mobile', async () => {
      // GIVEN: mobile viewport
      setViewport(375)

      // WHEN: shell renders
      renderShellAt('/clientes')

      // THEN: only the bar exists in the DOM
      await screen.findByTestId('navigation-bar')
      expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility — aria-labels on nav items', () => {
    test('[P1] should expose Spanish aria-label "Ir a Clientes" on the Clientes nav link', async () => {
      // GIVEN: desktop shell
      setViewport(1280)

      // WHEN: shell renders
      renderShellAt('/clientes')

      // THEN: the markered Clientes link carries the Spanish aria-label
      const link = await screen.findByTestId('nav-link-clientes')
      expect(link).toHaveAttribute('aria-label', 'Ir a Clientes')
    })

    test('[P1] should expose Spanish aria-label "Ir a Contactos" on the Contactos nav link', async () => {
      // GIVEN: desktop shell
      setViewport(1280)

      // WHEN: shell renders
      renderShellAt('/clientes')

      // THEN: the markered Contactos link carries the Spanish aria-label
      const link = await screen.findByTestId('nav-link-contactos')
      expect(link).toHaveAttribute('aria-label', 'Ir a Contactos')
    })
  })

  describe('Active-state edges (AC #6)', () => {
    test('[P2] should NOT flag any nav item as active when the route is unknown (404)', async () => {
      // GIVEN: an unknown route
      setViewport(1280)

      // WHEN: shell resolves the route (await router suspense via the 404 heading)
      renderShellAt('/totalmente-inexistente')
      // Wait for the NotFound view to be mounted so the shell + sr-only markers exist.
      expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()

      // THEN: neither active marker is rendered (only the inactive plain markers)
      expect(screen.queryByTestId('nav-item-clientes-active')).not.toBeInTheDocument()
      expect(screen.queryByTestId('nav-item-contactos-active')).not.toBeInTheDocument()
      // AND: the inactive markers ARE rendered
      expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
      expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
    })

    test('[P2] should keep Clientes active when the route is a nested path under /clientes', async () => {
      // GIVEN: a route prefixed with /clientes (will resolve to 404 since no child routes yet),
      // but the active prefix logic must still mark Clientes as active so the user sees their
      // section context preserved.
      setViewport(1280)

      // WHEN: shell renders for a nested /clientes/* path
      renderShellAt('/clientes/algo')

      // THEN: Clientes is still flagged active by the prefix match
      expect(await screen.findByTestId('nav-item-clientes-active')).toBeInTheDocument()
      expect(screen.queryByTestId('nav-item-contactos-active')).not.toBeInTheDocument()
    })
  })

  describe('Mobile NavigationBar — content parity', () => {
    test('[P2] should render both nav items inside the NavigationBar on mobile', async () => {
      // GIVEN: a mobile viewport
      setViewport(375)

      // WHEN: shell renders
      renderShellAt('/clientes')

      // THEN: the mobile bar holds both items
      const bar = await screen.findByTestId('navigation-bar')
      expect(within(bar).getByText('Clientes')).toBeInTheDocument()
      expect(within(bar).getByText('Contactos')).toBeInTheDocument()
    })
  })
})
