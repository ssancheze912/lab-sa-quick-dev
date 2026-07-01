/**
 * Story 1.2: Frontend Navigation Shell — Component Tests (RED phase)
 *
 * These tests exercise the RootLayout (`__root.tsx`) via TanStack Router's
 * `createMemoryHistory` so we can drive the router to any path without a browser.
 *
 * Acceptance Criteria covered here:
 *   AC1 — NavigationRail visible on desktop (component-level assertion)
 *   AC2 — NavigationBar visible on mobile
 *   AC4 — 404 view renders inside the shell for unknown routes
 *   AC5 — "/" redirects to /clientes
 *   AC6 — SPA navigation (router-driven, no window.location reassign) + active state
 *
 * Test Case Mapping (from test-design-epic-1.md):
 *   - TC-E1-P1-01 → SPA navigation, no full reload
 *   - TC-E1-P1-04 → 404 view
 *   - TC-E1-P2-01 → NavigationRail desktop
 *   - TC-E1-P2-02 → NavigationBar mobile
 *   - TC-E1-P2-03 → Index redirect
 *
 * Patterns applied:
 *   - Given-When-Then structure
 *   - data-testid selectors only (never CSS-class selectors)
 *   - Explicit waits via findBy* / waitFor — no hard sleeps
 *   - One primary assertion per test (atomic)
 *   - Each test builds a fresh in-memory router (isolation)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../routeTree.gen'

/**
 * Build a fresh router pointing at the given initial path.
 * Each test gets its own router + history + QueryClient for full isolation.
 *
 * Note (Story 2.1): the /clientes route now uses TanStack Query via
 * useClientes(), so the RouterProvider must be wrapped in a
 * QueryClientProvider even for tests that assert only on the shell.
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

/**
 * Force a matchMedia value so components that read viewport size at render
 * time see the desired breakpoint. Tailwind uses `min-width: 1024px` for `lg`.
 */
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
  // Default to a desktop viewport unless a test overrides it.
  mockViewport(1280)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-03 — Index "/" redirects to /clientes (AC5)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Index route redirects to /clientes', () => {
  it('should redirect from "/" to "/clientes" on initial load', async () => {
    // GIVEN: The user opens the app at the root path
    // WHEN: The router resolves the initial location
    renderAt('/')

    // THEN: The Clientes page is rendered (the redirect resolved)
    const clientes = await screen.findByTestId('page-clientes')
    expect(clientes).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-01 — NavigationRail visible on desktop (AC1)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail on desktop viewport', () => {
  it('should render the NavigationRail with Clientes and Contactos items', async () => {
    // GIVEN: A desktop viewport (≥ 1024px)
    mockViewport(1280)

    // WHEN: The user opens /clientes
    renderAt('/clientes')

    // THEN: The NavigationRail root is present
    const rail = await screen.findByTestId('nav-rail-desktop')
    expect(rail).toBeInTheDocument()
  })

  it('should mark the "Clientes" nav item as selected when the current route is /clientes (AC6)', async () => {
    // GIVEN: A desktop viewport, user on /clientes
    mockViewport(1280)
    renderAt('/clientes')

    // WHEN: The shell renders
    const activeItem = await screen.findByTestId('nav-item-clientes')

    // THEN: The Clientes item exposes its active/selected state via aria-current
    expect(activeItem).toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-02 — NavigationBar visible on mobile (AC2, FR29)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — NavigationBar on mobile viewport', () => {
  it('should render the mobile NavigationBar on a small viewport', async () => {
    // GIVEN: A mobile viewport (< 1024px)
    mockViewport(375)

    // WHEN: The user opens /clientes
    renderAt('/clientes')

    // THEN: The mobile NavigationBar is present in the DOM
    const bar = await screen.findByTestId('nav-bar-mobile')
    expect(bar).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-01 — SPA navigation without full reload (AC1, AC6, FR28)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1/AC6 — Router-driven SPA navigation (no full page reload)', () => {
  it('should navigate from /clientes to /contactos when the Contactos item is clicked', async () => {
    // GIVEN: The user is on /clientes on desktop
    mockViewport(1280)
    const { router } = renderAt('/clientes')

    const contactosItem = await screen.findByTestId('nav-item-contactos')

    // WHEN: The user clicks the Contactos rail item
    fireEvent.click(contactosItem)

    // THEN: The router's current pathname is now /contactos (router-driven, no window.location.href)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
  })

  it('should NOT reassign window.location.href when navigating between nav items (FR28)', async () => {
    // GIVEN: A spy on window.location.assign / href reassignment
    mockViewport(1280)
    const assignSpy = vi.fn()
    // Guard the spy: some jsdom versions treat location as read-only.
    // We install a proxy setter on `href` to detect any reassignment.
    const originalHref = window.location.href
    let hrefWasReassigned = false
    try {
      Object.defineProperty(window.location, 'href', {
        configurable: true,
        get: () => originalHref,
        set: () => {
          hrefWasReassigned = true
        },
      })
    } catch {
      // If jsdom doesn't allow redefining, we still verify via assign spy.
    }
    Object.defineProperty(window.location, 'assign', {
      configurable: true,
      value: assignSpy,
    })

    renderAt('/clientes')
    const contactosItem = await screen.findByTestId('nav-item-contactos')

    // WHEN: The user clicks a nav item
    fireEvent.click(contactosItem)

    // THEN: window.location was never reassigned (router handles navigation)
    await waitFor(() => {
      expect(hrefWasReassigned).toBe(false)
      expect(assignSpy).not.toHaveBeenCalled()
    })
  })

  it('should keep the persistent shell mounted across route changes (AC6)', async () => {
    // GIVEN: The user is on /clientes with the shell rendered
    mockViewport(1280)
    renderAt('/clientes')
    const shellBefore = await screen.findByTestId('app-content')
    expect(shellBefore).toBeInTheDocument()

    // WHEN: The user navigates to /contactos
    const contactosItem = await screen.findByTestId('nav-item-contactos')
    fireEvent.click(contactosItem)

    // THEN: The exact same shell node is still in the document (not remounted)
    await waitFor(() => {
      const shellAfter = screen.getByTestId('app-content')
      expect(shellAfter).toBe(shellBefore)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-04 — 404 view for unknown routes (AC4)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 not-found view for unknown routes', () => {
  it('should render the 404 view when the path does not match any route', async () => {
    // GIVEN: The user opens a URL that has no matching route
    // WHEN: The router resolves the path
    renderAt('/ruta-que-no-existe')

    // THEN: The 404 view is rendered (identified by data-testid="page-not-found")
    const notFound = await screen.findByTestId('page-not-found')
    expect(notFound).toBeInTheDocument()
  })

  it('should show the Spanish heading "Página no encontrada" in the 404 view', async () => {
    // GIVEN: The user opens an unknown route
    // WHEN: The 404 view is rendered
    renderAt('/no-existe-tampoco')

    // THEN: The Spanish heading is present
    const heading = await screen.findByText(/Página no encontrada/i)
    expect(heading).toBeInTheDocument()
  })

  it('should keep the navigation shell visible even when the 404 view is rendered', async () => {
    // GIVEN: The user opens an unknown route
    // WHEN: The 404 view is rendered inside the shell
    renderAt('/otro-no-existe')
    await screen.findByTestId('page-not-found')

    // THEN: The persistent shell wrapper is still mounted
    expect(screen.getByTestId('app-content')).toBeInTheDocument()
  })

  it('should offer a link back to /clientes from the 404 view', async () => {
    // GIVEN: The user opens an unknown route
    // WHEN: The 404 view renders
    renderAt('/no-existe')
    await screen.findByTestId('page-not-found')

    // THEN: A link labeled "Volver a Clientes" is present and points to /clientes
    const backLink = screen.getByRole('link', { name: /Volver a Clientes/i })
    expect(backLink).toHaveAttribute('href', '/clientes')
  })
})
