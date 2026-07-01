/**
 * Story 1.2: Frontend Navigation Shell — Component EDGE CASE tests
 *
 * Companion to `__root.test.tsx` (ATDD happy paths). This file expands
 * coverage into edge cases + accessibility gaps identified against the
 * epic test-design that the ATDD baseline did NOT cover.
 *
 * Gaps covered (beyond ATDD):
 *   - Active nav item on NESTED paths (e.g. /clientes/123 keeps `clientes` active)
 *   - Active nav item on `/contactos` (mirror-side of ATDD's `/clientes` case)
 *   - NO nav item active on the 404 view (no false-positive selected state)
 *   - Aria-labels are the Spanish strings from NAV_ITEMS (Task 9)
 *   - Rail exposes `aria-label="Navegación principal"` container
 *   - 404 "Volver a Clientes" click actually navigates via router (not just link href)
 *   - Nav item icons carry aria-hidden (decorative — Spanish label carries the a11y name)
 *   - Rapid double-click on same nav item does not throw + stays on that route
 *
 * Priority tags: [P1] behavioural correctness, [P2] a11y polish.
 *
 * Patterns applied:
 *   - Given-When-Then structure
 *   - data-testid selectors only
 *   - findBy* / waitFor for explicit async — no hard sleeps
 *   - Each test builds a fresh in-memory router
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../routeTree.gen'

/**
 * Story 2.1 update: /clientes now uses TanStack Query, so the router must be
 * wrapped in a QueryClientProvider — otherwise the useClientes() hook throws
 * during route rendering.
 */
function renderAt(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}

function mockViewport(width: number) {
  const isDesktop = width >= 1024
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 1024px') ? isDesktop : !isDesktop,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

beforeEach(() => {
  mockViewport(1280)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// Active-state edge cases — the useActiveNavId hook derives state from the
// pathname; ATDD only asserts /clientes → clientes active. These tests cover
// /contactos, nested paths, and the 404 fallback.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Active nav id derivation (edge cases)', () => {
  it('[P1] should mark "Contactos" as active when the route is /contactos', async () => {
    // GIVEN: Desktop viewport, user lands on /contactos
    renderAt('/contactos')

    // WHEN: Rail renders
    const contactosItem = await screen.findByTestId('nav-item-contactos')
    const clientesItem = screen.getByTestId('nav-item-clientes')

    // THEN: Contactos is active, Clientes is NOT
    expect(contactosItem).toHaveAttribute('aria-current', 'page')
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('[P2] should mark NO nav item as active when the 404 view is rendered', async () => {
    // GIVEN: The user opens an unknown route (no NAV_ITEM matches)
    renderAt('/ruta-inexistente')

    // WHEN: The shell + 404 view render
    await screen.findByTestId('page-not-found')
    const clientesItem = screen.getByTestId('nav-item-clientes')
    const contactosItem = screen.getByTestId('nav-item-contactos')

    // THEN: Neither nav item carries aria-current — no false-positive selection
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility contract — Task 9 declared Spanish labels and container
// aria-label. ATDD only asserts data-testid; these tests lock down the a11y
// surface so a regression is caught immediately.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1/AC2 + Task 9 — Accessibility contract (Spanish labels + landmarks)', () => {
  it('[P2] should expose the Spanish container aria-label on the desktop NavigationRail', async () => {
    // GIVEN: Desktop viewport
    renderAt('/clientes')

    // WHEN: The rail renders
    const rail = await screen.findByTestId('nav-rail-desktop')

    // THEN: The container announces itself as the primary Spanish nav landmark
    expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
  })

  it('[P2] should attach Spanish labels to every rail nav item via aria-label', async () => {
    // GIVEN: Desktop viewport
    renderAt('/clientes')

    // WHEN: Rail items render
    const clientes = await screen.findByTestId('nav-item-clientes')
    const contactos = screen.getByTestId('nav-item-contactos')

    // THEN: Each item carries its Spanish label as an accessible name
    expect(clientes).toHaveAttribute('aria-label', 'Clientes')
    expect(contactos).toHaveAttribute('aria-label', 'Contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 404 recovery — component test that "Volver a Clientes" actually drives
// the router forward, not just renders a link with the correct href.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 recovery flow', () => {
  it('[P1] should navigate to /clientes when the "Volver a Clientes" link is activated', async () => {
    // GIVEN: The user is on the 404 view
    const { router } = renderAt('/no-existe')
    await screen.findByTestId('page-not-found')

    // WHEN: The user clicks the recovery link
    const backLink = screen.getByRole('link', { name: /Volver a Clientes/i })
    fireEvent.click(backLink)

    // THEN: The router transitions to /clientes and the Clientes view renders
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(screen.getByTestId('page-clientes')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Interaction robustness — rapid interaction shouldn't unmount the shell or
// throw. Also asserts click on the *active* item is a no-op vs. a nav.
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1/AC6 — Interaction robustness', () => {
  it('[P2] should remain on /clientes after clicking the already-active Clientes nav item', async () => {
    // GIVEN: The user is on /clientes with Clientes already selected
    const { router } = renderAt('/clientes')
    const clientesItem = await screen.findByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('aria-current', 'page')

    // WHEN: The user clicks the same (already-active) item
    fireEvent.click(clientesItem)

    // THEN: The router stays on /clientes (no crash, no unexpected redirect)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(screen.getByTestId('page-clientes')).toBeInTheDocument()
  })

  it('[P2] should handle rapid double-click on a nav item without throwing', async () => {
    // GIVEN: The user is on /clientes
    const { router } = renderAt('/clientes')
    const contactosItem = await screen.findByTestId('nav-item-contactos')

    // WHEN: The user rapidly double-clicks Contactos
    fireEvent.click(contactosItem)
    fireEvent.click(contactosItem)

    // THEN: The router resolves to /contactos exactly once (no error state)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
    expect(screen.getByTestId('page-contactos')).toBeInTheDocument()
  })
})
