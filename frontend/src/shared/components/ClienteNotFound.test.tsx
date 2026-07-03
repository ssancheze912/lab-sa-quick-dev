/**
 * Story 2.2 — ClienteNotFound shared component (Automate expansion)
 *
 * Presentational tests for the <ClienteNotFound> panel that renders when
 * `useCliente()` resolves with `isError` + HTTP 404. ATDD coverage only
 * exercises the panel indirectly through <ClienteDetailView>; this suite adds
 * direct component-level coverage:
 *
 *   • [P1] Spanish copy is verbatim (AC #3 + AC #11).
 *   • [P1] The "Volver a la lista" link points to /clientes (never trapped).
 *   • [P2] data-testid hooks (cliente-not-found + cliente-not-found-back).
 *   • [P2] Focus-ring class hook present on the back link (a11y).
 *
 * A TanStack Router memory-router wrapper is mandatory — <Link> requires
 * router context, otherwise it throws.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { ClienteNotFound } from '@/shared/components/ClienteNotFound'

afterEach(() => cleanup())

// ─────────────────────────────────────────────────────────────────────────────
// Router harness — <Link to="/clientes"> requires a router context in tests
// ─────────────────────────────────────────────────────────────────────────────

function renderInRouter(ui: ReactNode, initialPath = '/clientes/unknown') {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const notFoundRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/unknown',
    component: () => <>{ui}</>,
  })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="stub-clientes-list">List</div>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([notFoundRoute, clientesRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Spanish copy — AC #3 + AC #11
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteNotFound — Spanish copy contract (AC #3, AC #11)', () => {
  it('[P1] should render the primary Spanish not-found message verbatim', async () => {
    // GIVEN / WHEN: The panel is mounted
    renderInRouter(<ClienteNotFound />)

    // THEN: The exact Spanish copy from AC #3 is present
    expect(
      await screen.findByText('No se encontró el cliente solicitado.'),
    ).toBeInTheDocument()
  })

  it('[P1] should render the Spanish secondary/context copy verbatim', async () => {
    // GIVEN / WHEN: The panel is mounted
    renderInRouter(<ClienteNotFound />)

    // THEN: The contextual copy explaining the 404 is visible
    expect(
      await screen.findByText(
        'Es posible que haya sido eliminado o que el enlace sea incorrecto.',
      ),
    ).toBeInTheDocument()
  })

  it('[P1] should render the "Volver a la lista" back-link text', async () => {
    // GIVEN / WHEN: The panel is mounted
    renderInRouter(<ClienteNotFound />)

    // THEN: The Spanish back-link label is present (CTA)
    expect(await screen.findByText('Volver a la lista')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Back-link navigation contract (never trapped)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteNotFound — back link navigation', () => {
  it('[P1] should render the back link as a real anchor pointing to /clientes', async () => {
    // GIVEN / WHEN: The panel is mounted
    renderInRouter(<ClienteNotFound />)

    // THEN: The back link is an <a> whose href resolves to /clientes exactly.
    //       No client-side-only button — the browser must be able to fallback
    //       to a normal navigation if JS fails.
    const back = await screen.findByTestId('cliente-not-found-back')
    expect(back.tagName.toLowerCase()).toBe('a')
    expect(back.getAttribute('href')).toBe('/clientes')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] data-testid hooks (contract with Playwright + Vitest)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] ClienteNotFound — data-testid hooks', () => {
  it('[P2] should expose data-testid="cliente-not-found" on the outer container', async () => {
    // GIVEN / WHEN: The panel is mounted
    renderInRouter(<ClienteNotFound />)

    // THEN: The outer wrapper carries the canonical test hook
    const panel = await screen.findByTestId('cliente-not-found')
    expect(panel).toBeInTheDocument()
  })

  it('[P2] should expose data-testid="cliente-not-found-back" on the CTA link', async () => {
    // GIVEN / WHEN: The panel is mounted
    renderInRouter(<ClienteNotFound />)

    // THEN: The CTA link carries the canonical test hook (Playwright uses this)
    expect(await screen.findByTestId('cliente-not-found-back')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Accessibility hints — focus ring class present on the back link
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] ClienteNotFound — accessibility class hooks', () => {
  it('[P2] should apply focus-visible ring classes to the back link', async () => {
    // GIVEN / WHEN: The panel is mounted
    renderInRouter(<ClienteNotFound />)

    // THEN: The anchor advertises the focus ring so keyboard users can locate
    //       the CTA (P0 a11y rule from Story 2.1 accessibility pass)
    const back = await screen.findByTestId('cliente-not-found-back')
    expect(back.className).toMatch(/focus-visible:ring-2/)
    expect(back.className).toMatch(/focus-visible:outline-none/)
  })
})
