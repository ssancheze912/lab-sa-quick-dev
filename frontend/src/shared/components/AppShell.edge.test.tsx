/**
 * Story 1.2 — Automate phase EDGE tests for AppShell
 *
 * Complements AppShell.test.tsx (ATDD baseline). Adds edge / negative
 * coverage that the ATDD tests intentionally left out:
 *
 *   - Active-state flips correctly when navigating mid-test (AC #6).
 *   - No active marker when pathname is outside the known nav set (AC #6).
 *   - Mobile viewport: clicking a nav item does NOT reassign window.location
 *     (FR28 — parity with desktop coverage from ATDD).
 *   - Single source of truth — exactly ONE "Clientes" label inside the
 *     desktop nav wrapper (prevents accidental duplicate rendering when the
 *     nav config is later modified).
 *   - Mobile aria-current parity with desktop (AC #6 on mobile).
 *
 * RED-phase note: NONE — this file runs after the GREEN phase and tests
 * additional invariants. All tests must pass on the implemented AppShell.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { AppShell } from './AppShell'

afterEach(() => {
  cleanup()
})

function renderShellAt(initialPath: '/clientes' | '/contactos' | '/desconocido') {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
    notFoundComponent: () => (
      <AppShell>
        <div data-testid="not-found-view">404</div>
      </AppShell>
    ),
  })

  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-view">Vista Clientes</div>,
  })

  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-view">Vista Contactos</div>,
  })

  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return { ...render(<RouterProvider router={router} />), router }
}

describe('AppShell desktop edges (>= 1024px) — automate phase', () => {
  beforeEach(() => {
    window.innerWidth = 1280
    window.innerHeight = 800
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('min-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('[P1] flips active marker from Clientes to Contactos when nav happens mid-test (AC #6)', () => {
    // GIVEN: starts at /clientes
    renderShellAt('/clientes')
    const desktop = screen.getByTestId('app-shell-desktop')

    // WHEN: user clicks Contactos in the rail
    fireEvent.click(within(desktop).getByText('Contactos'))

    // THEN: Contactos view is mounted AND aria-current moved to Contactos
    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    const buttons = Array.from(desktop.querySelectorAll('button'))
    const contactosBtn = buttons.find((b) => b.textContent?.trim() === 'Contactos')
    const clientesBtn = buttons.find((b) => b.textContent?.trim() === 'Clientes')
    expect(contactosBtn).toBeDefined()
    expect(clientesBtn).toBeDefined()
    expect(contactosBtn?.getAttribute('aria-current')).toBe('page')
    expect(clientesBtn?.hasAttribute('aria-current')).toBe(false)
  })

  it('[P2] does NOT set aria-current on any nav button when pathname is outside known routes', () => {
    // GIVEN: pathname is /desconocido (resolves to notFoundComponent)
    renderShellAt('/desconocido')

    // WHEN: shell renders
    const desktop = screen.getByTestId('app-shell-desktop')

    // THEN: no button inside the desktop nav advertises aria-current
    const buttons = Array.from(desktop.querySelectorAll('button'))
    const withAriaCurrent = buttons.filter((b) => b.hasAttribute('aria-current'))
    expect(withAriaCurrent).toHaveLength(0)
  })

  it('[P2] renders EXACTLY one "Clientes" label inside the desktop nav wrapper (single source of truth)', () => {
    // GIVEN: starts at /clientes
    renderShellAt('/clientes')

    // WHEN: shell renders
    const desktop = screen.getByTestId('app-shell-desktop')

    // THEN: exactly one Clientes label and exactly one Contactos label inside
    //       the wrapper — guards against accidental duplicate nav rendering
    //       (e.g. if NavigationRailGroup is composed inside LayoutBase later).
    expect(within(desktop).getAllByText('Clientes')).toHaveLength(1)
    expect(within(desktop).getAllByText('Contactos')).toHaveLength(1)
  })

  it('[P1] nested AppShell (NotFound pattern) does NOT duplicate desktop wrapper testid', () => {
    // GIVEN: a route tree where the notFoundComponent itself wraps its
    //        content in AppShell (as the dev notes prescribe).
    renderShellAt('/desconocido')

    // WHEN: NotFound resolves
    // THEN: exactly ONE app-shell-desktop wrapper in the document
    expect(screen.getAllByTestId('app-shell-desktop')).toHaveLength(1)
    // AND: the NotFoundView (mocked) is rendered inside it
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
  })
})

describe('AppShell mobile edges (< 1024px) — automate phase', () => {
  beforeEach(() => {
    window.innerWidth = 375
    window.innerHeight = 812
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: !query.includes('min-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('[P1] tapping Contactos on the mobile bar does NOT reassign window.location (FR28)', () => {
    // GIVEN: mobile shell mounted at /clientes
    renderShellAt('/clientes')

    // Spy on (forbidden) hard-navigation attempts
    const assignSpy = vi.fn()
    const replaceSpy = vi.fn()
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignSpy,
        replace: replaceSpy,
      },
    })

    // WHEN: user taps Contactos on the mobile bar
    const mobile = screen.getByTestId('app-shell-mobile')
    fireEvent.click(within(mobile).getByText('Contactos'))

    // THEN: router rendered the Contactos view (SPA)
    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    // AND: window.location was never reassigned
    expect(assignSpy).not.toHaveBeenCalled()
    expect(replaceSpy).not.toHaveBeenCalled()

    // Cleanup
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('[P1] mobile bar stamps aria-current on the active item (AC #6 mobile parity)', () => {
    // GIVEN: mobile shell mounted at /contactos
    renderShellAt('/contactos')

    // WHEN: shell renders
    const mobile = screen.getByTestId('app-shell-mobile')

    // THEN: the Contactos mobile button advertises aria-current
    const buttons = Array.from(mobile.querySelectorAll('button'))
    const contactosBtn = buttons.find((b) => b.textContent?.trim() === 'Contactos')
    const clientesBtn = buttons.find((b) => b.textContent?.trim() === 'Clientes')
    expect(contactosBtn?.getAttribute('aria-current')).toBe('page')
    expect(clientesBtn?.hasAttribute('aria-current')).toBe(false)
  })

  it('[P2] only the mobile wrapper is rendered (no leaking desktop wrapper on small viewports)', () => {
    // GIVEN: mobile viewport
    renderShellAt('/clientes')

    // WHEN: shell renders
    // THEN: mobile wrapper exists, desktop wrapper does not
    expect(screen.getByTestId('app-shell-mobile')).toBeInTheDocument()
    expect(screen.queryByTestId('app-shell-desktop')).toBeNull()
  })
})
