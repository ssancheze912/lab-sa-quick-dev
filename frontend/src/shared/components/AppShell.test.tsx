/**
 * Story 1.2: Frontend Navigation Shell — Task 5
 *
 * Vitest + React Testing Library component tests for the responsive AppShell.
 *
 * Acceptance Criteria covered:
 *   AC #1 — Desktop NavigationRail visible on >= lg with Clientes & Contactos.
 *   AC #2 — Mobile NavigationBar visible below lg.
 *   AC #6 — Active state computed from current pathname.
 *   AC #7 — Spanish ariaLabel on both nav containers.
 *
 * Test cases owned: TC-E1-P1-01 (no-reload click on rail), TC-E1-P2-01 (rail
 *   visible on desktop), TC-E1-P2-02 (bar visible on mobile).
 *
 * RED-phase status: AppShell.tsx does NOT exist yet → import will fail.
 * Tailwind `lg:` classes don't apply in jsdom; tests assert on the stable
 * `data-testid="app-shell-desktop"` / `data-testid="app-shell-mobile"`
 * wrapper testids (per Dev Notes — Testing standards).
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
// RED: AppShell.tsx does not exist yet — this import will fail until Task 2 is done.
import { AppShell } from './AppShell'

afterEach(() => {
  cleanup()
})

/**
 * Helper: build a minimal in-memory TanStack Router with AppShell as the
 * persistent wrapper around an <Outlet />. Renders distinct testids per route
 * so we can assert active-state + navigation transitions.
 */
function renderShellAt(initialPath: '/clientes' | '/contactos') {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
  })

  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-view">Clientes</div>,
  })

  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-view">Contactos</div>,
  })

  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return render(<RouterProvider router={router} />)
}

describe('AppShell — desktop viewport (>= 1024px) [TC-E1-P2-01]', () => {
  beforeEach(() => {
    // Force "desktop" viewport so any matchMedia-driven branches resolve to lg.
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

  it('renders the desktop shell wrapper with data-testid="app-shell-desktop" (AC #1)', () => {
    // GIVEN: a desktop viewport, WHEN the AppShell mounts at /clientes
    renderShellAt('/clientes')

    // THEN: the desktop wrapper is in the DOM
    expect(screen.getByTestId('app-shell-desktop')).toBeInTheDocument()
  })

  it('renders both "Clientes" and "Contactos" Spanish labels in the desktop rail (AC #1, #7)', () => {
    // GIVEN: desktop viewport at /clientes
    renderShellAt('/clientes')

    // WHEN: the desktop shell renders, THEN both Spanish labels are visible
    const desktop = screen.getByTestId('app-shell-desktop')
    expect(within(desktop).getByText('Clientes')).toBeInTheDocument()
    expect(within(desktop).getByText('Contactos')).toBeInTheDocument()
  })

  it('exposes Spanish ariaLabel "Navegación principal" on the desktop nav container (AC #7)', () => {
    // GIVEN: desktop viewport
    renderShellAt('/clientes')

    // WHEN: shell renders, THEN the desktop nav container exposes the Spanish aria-label
    const desktop = screen.getByTestId('app-shell-desktop')
    expect(
      desktop.querySelector('[aria-label="Navegación principal"]'),
    ).not.toBeNull()
  })

  it('navigates to /contactos via TanStack Router when the Contactos entry is clicked — no window.location reassignment (AC #1, TC-E1-P1-01)', () => {
    // GIVEN: starts at /clientes on desktop
    renderShellAt('/clientes')
    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()

    // Spy on any (forbidden) hard navigation attempts.
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

    // WHEN: the user clicks the Contactos entry in the desktop shell
    const desktop = screen.getByTestId('app-shell-desktop')
    const contactosEntry = within(desktop).getByText('Contactos')
    fireEvent.click(contactosEntry)

    // THEN: the router rendered the Contactos view
    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()

    // AND: window.location was NEVER reassigned (no full page reload, FR28)
    expect(assignSpy).not.toHaveBeenCalled()
    expect(replaceSpy).not.toHaveBeenCalled()

    // Cleanup
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('marks the Clientes entry as active when current pathname is /clientes (AC #6)', () => {
    // GIVEN: desktop viewport at /clientes
    renderShellAt('/clientes')

    // WHEN: shell renders
    const desktop = screen.getByTestId('app-shell-desktop')

    // THEN: at least one element marked as active exists for "Clientes"
    //       (impl may use aria-current, data-active="true" or data-state="active")
    const allActive = desktop.querySelectorAll(
      '[aria-current], [data-active="true"], [data-state="active"]',
    )
    const anyActiveMentionsClientes = Array.from(allActive).some((el) =>
      el.textContent?.includes('Clientes'),
    )
    expect(anyActiveMentionsClientes).toBe(true)
  })
})

describe('AppShell — mobile viewport (< 1024px) [TC-E1-P2-02]', () => {
  beforeEach(() => {
    window.innerWidth = 375
    window.innerHeight = 812
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        // matchMedia(min-width: 1024px) → false on mobile
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

  it('renders the mobile shell wrapper with data-testid="app-shell-mobile" (AC #2)', () => {
    // GIVEN: a mobile viewport
    // WHEN: shell mounts at /clientes
    renderShellAt('/clientes')

    // THEN: mobile wrapper is rendered
    expect(screen.getByTestId('app-shell-mobile')).toBeInTheDocument()
  })

  it('exposes Spanish ariaLabel "Navegación inferior" on the mobile NavigationBar (AC #2, #7)', () => {
    // GIVEN: mobile viewport
    renderShellAt('/clientes')

    // WHEN: shell renders
    const mobile = screen.getByTestId('app-shell-mobile')

    // THEN: the mobile nav container exposes the Spanish aria-label
    expect(mobile.querySelector('[aria-label="Navegación inferior"]')).not.toBeNull()
  })

  it('renders both Spanish nav entries on the mobile NavigationBar (AC #2)', () => {
    // GIVEN: mobile viewport
    renderShellAt('/clientes')

    // WHEN: shell renders
    const mobile = screen.getByTestId('app-shell-mobile')

    // THEN: both nav items are present
    expect(within(mobile).getByText('Clientes')).toBeInTheDocument()
    expect(within(mobile).getByText('Contactos')).toBeInTheDocument()
  })
})
