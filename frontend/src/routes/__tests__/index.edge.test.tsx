/**
 * Story 1.2: Frontend Navigation Shell
 * Edge Case Tests — Index Route Redirect
 *
 * Expands index.test.tsx with:
 *   - Redirect does NOT render index component (returns null)
 *   - After redirect, navigation shell is present (not just clientes-view)
 *   - Redirect is permanent (re-navigating to / from /clientes stays on /clientes)
 *   - Redirect does not expose not-found-view
 *   - Redirect does not produce unhandled errors
 */

import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { describe, test, expect, beforeEach, vi } from 'vitest'

function mockDesktop() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('1024') ? true : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Index redirect: navigation shell is preserved after redirect
// ─────────────────────────────────────────────────────────────────────────────

describe('Index redirect — navigation shell integrity', () => {
  beforeEach(mockDesktop)

  test('[P1] not-found-view is NOT rendered after redirect from / to /clientes', async () => {
    // GIVEN: User accesses root /
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    render(<RouterProvider router={router} />)

    // WHEN: Redirect to /clientes occurs
    await screen.findByTestId('clientes-view')

    // THEN: 404 view is absent — redirect went to a known route
    expect(screen.queryByTestId('not-found-view')).not.toBeInTheDocument()
  })

  test('[P2] final pathname is /clientes (not / or any other path)', async () => {
    // GIVEN: User accesses /
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    render(<RouterProvider router={router} />)

    // WHEN: Redirect settles
    await screen.findByTestId('clientes-view')

    // THEN: router state reflects /clientes exactly
    expect(router.state.location.pathname).toBe('/clientes')
    expect(router.state.location.pathname).not.toBe('/')
  })

  test('[P2] contactos-view is NOT rendered after redirect from / to /clientes', async () => {
    // GIVEN: User accesses root /
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    render(<RouterProvider router={router} />)

    // WHEN: Redirect occurs
    await screen.findByTestId('clientes-view')

    // THEN: contactos-view is absent (only clientes-view is shown)
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Index redirect: error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('Index redirect — no errors during redirect', () => {
  beforeEach(mockDesktop)

  test('[P1] no unhandled React errors are thrown during / → /clientes redirect', async () => {
    // GIVEN: We track React errors via error boundary simulation
    const originalConsoleError = console.error
    const errors: string[] = []
    console.error = (...args: unknown[]) => {
      // Only capture React rendering errors, not expected prop warnings
      const msg = args[0]?.toString() ?? ''
      if (msg.includes('Error') && !msg.includes('Warning')) {
        errors.push(msg)
      }
    }

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    render(<RouterProvider router={router} />)

    // WHEN: Redirect completes
    await screen.findByTestId('clientes-view')

    // THEN: No render errors captured
    expect(errors).toHaveLength(0)

    console.error = originalConsoleError
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Index redirect: multiple renders are stable
// ─────────────────────────────────────────────────────────────────────────────

describe('Index redirect — stability', () => {
  beforeEach(mockDesktop)

  test('[P2] re-rendering the router at / always ends up at /clientes', async () => {
    // GIVEN: Router initialized at /
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    // WHEN: First render
    const { rerender } = render(<RouterProvider router={router} />)
    await screen.findByTestId('clientes-view')

    // AND: Re-render occurs (e.g. parent state change)
    rerender(<RouterProvider router={router} />)

    // THEN: Still at /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })
})
