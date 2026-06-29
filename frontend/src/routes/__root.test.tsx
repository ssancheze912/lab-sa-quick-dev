/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Component Tests — RED Phase
 * These tests intentionally FAIL until __root.tsx is implemented with
 * siesa-ui-kit's LayoutBase + NavigationRail (desktop) + NavigationBar (mobile).
 *
 * Acceptance Criteria covered:
 *   AC #1 — NavigationRail visible on desktop (viewport >= lg/1024px) with Clientes + Contactos entries
 *   AC #2 — NavigationBar visible on mobile (viewport < lg/1024px), rail hidden, items tappable
 *   AC #6 — Active item highlighted on active route via siesa-ui-kit active-state
 *
 * Test cases:
 *   TC-E1-P2-01  NavigationRail visible on desktop viewport
 *   TC-E1-P2-02  NavigationBar visible on mobile viewport
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Viewport / matchMedia helpers — Tailwind lg: breakpoint = 1024px
// ─────────────────────────────────────────────────────────────────────────────

function setViewport(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })

  // Tailwind responsive utilities (`hidden lg:flex`, `lg:hidden`) are CSS-only
  // and jsdom does not evaluate them. Components that use JS-driven matchMedia
  // need a stub so the responsive swap can resolve in the test environment.
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

// ─────────────────────────────────────────────────────────────────────────────

describe('Shell layout — __root.tsx (Story 1.2 / AC #1, #2, #6)', () => {
  beforeEach(() => {
    // Default to desktop; tests override per-case.
    setViewport(1280)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // TC-E1-P2-01 — NavigationRail desktop ────────────────────────────────────
  describe('AC #1 — NavigationRail on desktop (viewport >= lg / 1024px)', () => {
    test('renders the NavigationRail with Clientes and Contactos entries', async () => {
      // GIVEN: a desktop viewport (1280 px)
      setViewport(1280)

      // WHEN: the shell renders
      renderShellAt('/clientes')

      // THEN: the rail is in the DOM with both nav entries
      const rail = await screen.findByTestId('navigation-rail')
      expect(rail).toBeInTheDocument()
      expect(within(rail).getByText('Clientes')).toBeInTheDocument()
      expect(within(rail).getByText('Contactos')).toBeInTheDocument()
    })

    test('hides the NavigationBar on desktop', async () => {
      // GIVEN: a desktop viewport
      setViewport(1280)

      // WHEN: the shell renders
      renderShellAt('/clientes')

      // THEN: the mobile navigation bar is NOT mounted
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
    })
  })

  // TC-E1-P2-02 — NavigationBar mobile ──────────────────────────────────────
  describe('AC #2 — NavigationBar on mobile (viewport < lg / 1024px)', () => {
    test('renders the NavigationBar with Clientes and Contactos entries', async () => {
      // GIVEN: a mobile viewport (375 px)
      setViewport(375)

      // WHEN: the shell renders
      renderShellAt('/clientes')

      // THEN: the mobile bar is in the DOM with both nav entries
      const bar = await screen.findByTestId('navigation-bar')
      expect(bar).toBeInTheDocument()
      expect(within(bar).getByText('Clientes')).toBeInTheDocument()
      expect(within(bar).getByText('Contactos')).toBeInTheDocument()
    })

    test('hides the NavigationRail on mobile', async () => {
      // GIVEN: a mobile viewport
      setViewport(375)

      // WHEN: the shell renders
      renderShellAt('/clientes')

      // THEN: the desktop rail is NOT mounted
      expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
    })
  })

  // AC #6 — Active item highlighting ────────────────────────────────────────
  describe('AC #6 — Active route is highlighted in the navigation', () => {
    test('marks "Clientes" as active when route is /clientes', async () => {
      // GIVEN: desktop viewport and the user is on /clientes
      setViewport(1280)

      // WHEN: the shell renders at /clientes
      renderShellAt('/clientes')

      // THEN: the "Clientes" rail item is flagged active via data-testid
      const activeItem = await screen.findByTestId('nav-item-clientes-active')
      expect(activeItem).toBeInTheDocument()
    })

    test('marks "Contactos" as active when route is /contactos', async () => {
      // GIVEN: desktop viewport and the user is on /contactos
      setViewport(1280)

      // WHEN: the shell renders at /contactos
      renderShellAt('/contactos')

      // THEN: the "Contactos" rail item is flagged active via data-testid
      const activeItem = await screen.findByTestId('nav-item-contactos-active')
      expect(activeItem).toBeInTheDocument()
    })
  })
})
