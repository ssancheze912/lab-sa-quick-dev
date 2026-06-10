/**
 * Story 1.2: Frontend Navigation Shell
 * Breakpoint, Hook Lifecycle & Redirect Tests — Unit/Component level
 *
 * Covers:
 *   - Breakpoint boundary: innerWidth exactly at 1024px (the threshold)
 *   - Breakpoint boundary: 1023px (one pixel below → mobile)
 *   - Route views: content integrity for clientes-view and contactos-view
 *   - useIsDesktop hook: matchMedia addEventListener called on mount
 *   - useIsDesktop hook: matchMedia query string contains 1024
 *   - Root redirect: navigation shell is preserved after redirect from /
 *
 * ARIA and active-state tests are in root.edge.test.tsx.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../../routeTree.gen'
import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { clienteHandlers } from '../../test/handlers/clientes'

// MSW server to handle /api/v1/clientes calls made by ClienteListPanel
const server = setupServer(...clienteHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 0, staleTime: 0 } } })
}

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

function renderWithQueryProvider(router: ReturnType<typeof createTestRouter>) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

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
// Breakpoint boundary: exactly 1024px
// ─────────────────────────────────────────────────────────────────────────────

describe('Breakpoint boundary — innerWidth exactly 1024px', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    // At exactly 1024 the condition is >= 1024 → desktop
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
  })
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] renders navigation-rail (desktop) at exactly 1024px wide', async () => {
    // GIVEN: Viewport is exactly at the breakpoint boundary (1024px)
    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)

    // WHEN: App renders
    // THEN: Desktop rail is shown (>= 1024 → desktop)
    const rail = await screen.findByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint boundary: 1023px (one pixel below the threshold → mobile)
// ─────────────────────────────────────────────────────────────────────────────

describe('Breakpoint boundary — innerWidth 1023px (one below threshold)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1023 })
    // At 1023 the condition < 1024 → mobile
    window.matchMedia = vi.fn().mockImplementation((_query: string) => ({
      matches: false,
      media: _query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] renders navigation-bar (mobile) at 1023px wide', async () => {
    // GIVEN: Viewport is one pixel below the desktop threshold (1023px → mobile)
    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)

    // WHEN: App renders
    // THEN: Mobile bar is shown (< 1024 → mobile)
    const bar = await screen.findByTestId('navigation-bar')
    expect(bar).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Route rendering: both views render the correct data-testid
// ─────────────────────────────────────────────────────────────────────────────

describe('Route views — content integrity', () => {
  beforeEach(mockDesktop)
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] clientes-view is present when navigating to /clientes', async () => {
    // GIVEN: User is on /clientes
    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)

    // WHEN: ClientesView renders
    // THEN: The clientes-view container is in the DOM
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument()
  })

  test('[P2] contactos-view contains text "Contactos"', async () => {
    // GIVEN: User is on /contactos
    const router = createTestRouter('/contactos')
    renderWithQueryProvider(router)

    // WHEN: ContactosView renders
    const view = await screen.findByTestId('contactos-view')

    // THEN: It contains the placeholder text
    expect(view).toHaveTextContent('Contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useIsDesktop: matchMedia addEventListener is called on mount
// ─────────────────────────────────────────────────────────────────────────────

describe('useIsDesktop hook — event listener lifecycle', () => {
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P2] matchMedia addEventListener is called on mount to track breakpoint changes', async () => {
    // GIVEN: Desktop viewport
    const addEventListenerMock = vi.fn()
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024') ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)

    // WHEN: App renders
    await screen.findByTestId('navigation-rail')

    // THEN: addEventListener was called to register the breakpoint listener
    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))
  })

  test('[P2] matchMedia is called with min-width: 1024px query', async () => {
    // GIVEN: Desktop viewport
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024') ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    window.matchMedia = matchMediaMock

    const router = createTestRouter('/clientes')
    renderWithQueryProvider(router)

    // WHEN: App renders
    await screen.findByTestId('navigation-rail')

    // THEN: matchMedia was called with the correct breakpoint query
    expect(matchMediaMock).toHaveBeenCalledWith(expect.stringContaining('1024'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Redirect: / redirects and preserves navigation structure
// ─────────────────────────────────────────────────────────────────────────────

describe('Root redirect — navigation shell preserved after redirect', () => {
  beforeEach(mockDesktop)
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  test('[P1] navigation-rail is visible after redirect from / to /clientes', async () => {
    // GIVEN: User accesses root /
    const router = createTestRouter('/')
    renderWithQueryProvider(router)

    // WHEN: Redirect to /clientes occurs
    await screen.findByTestId('clientes-view')

    // THEN: Navigation shell is also rendered
    const rail = screen.queryByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()
  })

  test('[P1] both nav items rendered after redirect from / to /clientes', async () => {
    // GIVEN: User accesses root /
    const router = createTestRouter('/')
    renderWithQueryProvider(router)

    // WHEN: Redirect occurs and clientes-view appears
    await screen.findByTestId('clientes-view')

    // THEN: Both nav items are present in the navigation
    await waitFor(() => {
      expect(screen.queryByTestId('nav-item-clientes')).toBeInTheDocument()
      expect(screen.queryByTestId('nav-item-contactos')).toBeInTheDocument()
    })
  })
})
