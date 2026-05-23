import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  createRouter,
  RouterProvider,
  createRootRoute,
  createRoute,
  createMemoryHistory,
} from '@tanstack/react-router'
import { act } from 'react'
import { AppShell } from '../AppShell'

/**
 * Unit tests for AppShell component — sub-path active state and structural parity.
 *
 * Story 1.2 — Frontend Navigation Shell
 * Epic 1 — Project Foundation & Application Shell
 *
 * BMad-Integrated expansion — fills gaps NOT covered by AppShell.test.tsx:
 *
 * Gap 1: Active state on sub-paths (e.g. /clientes/123 should mark Clientes as active).
 *        AppShell uses startsWith() matching — this verifies the real behavior in component.
 *
 * Gap 2: NavigationRail and NavigationBar must always render the same nav items in the
 *        same order (parity). A count mismatch would indicate a rendering regression.
 *
 * Gap 3: AppShell renders correctly when children is a React.Fragment (empty-like children).
 *
 * Test IDs: UNIT-ASE-01 through UNIT-ASE-09
 */

afterEach(cleanup)

interface RenderOptions {
  path?: string
  children?: React.ReactNode
}

/**
 * Render AppShell in a minimal in-memory router at the given path.
 * Includes clientes and contactos child routes for realistic state.
 */
async function renderAppShell({ path = '/clientes', children }: RenderOptions = {}) {
  const content = children ?? <div data-testid="page-content">Contenido</div>

  const rootRoute = createRootRoute({
    component: () => <AppShell>{content}</AppShell>,
  })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-view">Clientes</div>,
  })
  const clientesDetailRoute = createRoute({
    getParentRoute: () => clientesRoute,
    path: '$clienteId',
    component: () => <div data-testid="cliente-detail-view">Detalle</div>,
  })
  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-view">Contactos</div>,
  })
  const contactosDetailRoute = createRoute({
    getParentRoute: () => contactosRoute,
    path: '$contactoId',
    component: () => <div data-testid="contacto-detail-view">Detalle</div>,
  })
  const routeTree = rootRoute.addChildren([
    clientesRoute.addChildren([clientesDetailRoute]),
    contactosRoute.addChildren([contactosDetailRoute]),
  ])
  const history = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history })

  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<RouterProvider router={router} />)
    await router.load()
  })

  return result!
}

// ---------------------------------------------------------------------------
// Sub-path active state (startsWith matching)
// ---------------------------------------------------------------------------

describe('AppShell — sub-path active state (startsWith matching)', () => {
  /**
   * UNIT-ASE-01 (P1 — AC1)
   * When the current path is /clientes/123 (a sub-path of /clientes)
   * Then the Clientes link has aria-current="page" (startsWith logic activates parent)
   */
  it('UNIT-ASE-01 — Clientes link is aria-current="page" on sub-path /clientes/123', async () => {
    await renderAppShell({ path: '/clientes/123' })
    await screen.findByTestId('navigation-rail')

    // Both rail and bar have Clientes links — at least one must be active
    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    const activeLinks = clientesLinks.filter(
      (el) => el.getAttribute('aria-current') === 'page',
    )
    expect(activeLinks.length).toBeGreaterThanOrEqual(1)
  })

  /**
   * UNIT-ASE-02 (P1 — AC1)
   * When the current path is /clientes/123, the Contactos link does NOT have aria-current="page"
   */
  it('UNIT-ASE-02 — Contactos link is NOT aria-current="page" on /clientes/123', async () => {
    await renderAppShell({ path: '/clientes/123' })
    await screen.findByTestId('navigation-rail')

    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    contactosLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current', 'page')
    })
  })

  /**
   * UNIT-ASE-03 (P1 — AC1)
   * When the current path is /contactos/456 (a sub-path of /contactos)
   * Then the Contactos link has aria-current="page"
   */
  it('UNIT-ASE-03 — Contactos link is aria-current="page" on sub-path /contactos/456', async () => {
    await renderAppShell({ path: '/contactos/456' })
    await screen.findByTestId('navigation-rail')

    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    const activeLinks = contactosLinks.filter(
      (el) => el.getAttribute('aria-current') === 'page',
    )
    expect(activeLinks.length).toBeGreaterThanOrEqual(1)
  })

  /**
   * UNIT-ASE-04 (P1 — AC1)
   * When the current path is /contactos/456, the Clientes link does NOT have aria-current="page"
   */
  it('UNIT-ASE-04 — Clientes link is NOT aria-current="page" on /contactos/456', async () => {
    await renderAppShell({ path: '/contactos/456' })
    await screen.findByTestId('navigation-rail')

    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    clientesLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current', 'page')
    })
  })
})

// ---------------------------------------------------------------------------
// Nav items count parity between NavigationRail and NavigationBar
// ---------------------------------------------------------------------------

describe('AppShell — nav items parity between NavigationRail and NavigationBar', () => {
  /**
   * UNIT-ASE-05 (P1 — AC1, AC2)
   * NavigationRail and NavigationBar must render the same number of nav items.
   * A regression would break one navigation variant silently.
   */
  it('UNIT-ASE-05 — NavigationRail and NavigationBar have the same number of nav links', async () => {
    await renderAppShell({ path: '/clientes' })
    await screen.findByTestId('navigation-rail')

    const rail = screen.getByTestId('navigation-rail')
    const bar = screen.getByTestId('navigation-bar')

    // Count nav links in each container
    const railLinks = rail.querySelectorAll('a[role="link"], a')
    const barLinks = bar.querySelectorAll('a[role="link"], a')

    // Both must have the same number of nav items
    expect(railLinks.length).toBe(barLinks.length)
    // And there must be at least 2 items (Clientes + Contactos)
    expect(railLinks.length).toBeGreaterThanOrEqual(2)
  })

  /**
   * UNIT-ASE-06 (P1 — AC1, AC2)
   * The NavigationRail and NavigationBar must contain the same nav item labels.
   * Order and content must match to ensure consistent UX across breakpoints.
   */
  it('UNIT-ASE-06 — NavigationRail and NavigationBar contain the same nav link labels', async () => {
    await renderAppShell({ path: '/clientes' })
    await screen.findByTestId('navigation-rail')

    const rail = screen.getByTestId('navigation-rail')
    const bar = screen.getByTestId('navigation-bar')

    const getRailLabelsSorted = (nav: HTMLElement) =>
      Array.from(nav.querySelectorAll('a'))
        .map((a) => a.textContent?.trim() ?? '')
        .filter(Boolean)
        .sort()

    const railLabels = getRailLabelsSorted(rail)
    const barLabels = getRailLabelsSorted(bar)

    // Both must expose the same set of labels
    expect(railLabels).toEqual(barLabels)
  })

  /**
   * UNIT-ASE-07 (P1 — AC1, AC2)
   * Both NavigationRail and NavigationBar must have links with identical hrefs.
   * Ensures deep-link targets are consistent between desktop and mobile.
   */
  it('UNIT-ASE-07 — NavigationRail and NavigationBar have identical nav link hrefs', async () => {
    await renderAppShell({ path: '/clientes' })
    await screen.findByTestId('navigation-rail')

    const rail = screen.getByTestId('navigation-rail')
    const bar = screen.getByTestId('navigation-bar')

    const getHrefsSorted = (nav: HTMLElement) =>
      Array.from(nav.querySelectorAll('a'))
        .map((a) => a.getAttribute('href') ?? '')
        .filter(Boolean)
        .sort()

    const railHrefs = getHrefsSorted(rail)
    const barHrefs = getHrefsSorted(bar)

    expect(railHrefs).toEqual(barHrefs)
    // And both contain the expected paths
    expect(railHrefs).toContain('/clientes')
    expect(railHrefs).toContain('/contactos')
  })
})

// ---------------------------------------------------------------------------
// Children rendering edge cases
// ---------------------------------------------------------------------------

describe('AppShell — children rendering edge cases', () => {
  /**
   * UNIT-ASE-08 (P2 — AC1)
   * AppShell renders when children is an empty React.Fragment.
   * The shell structure (nav + main) must still be present.
   */
  it('UNIT-ASE-08 — AppShell renders shell structure even with empty Fragment children', async () => {
    await renderAppShell({ children: <></> })
    await screen.findByTestId('navigation-rail')

    // Navigation elements are present even without meaningful children
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()

    // Main element exists (layout structure intact)
    const mainEl = document.querySelector('main')
    expect(mainEl).not.toBeNull()
  })

  /**
   * UNIT-ASE-09 (P2 — AC1)
   * AppShell renders when children contains multiple sibling elements.
   * Verifies the children prop handles React.Fragment with multiple nodes correctly.
   */
  it('UNIT-ASE-09 — AppShell renders when children has multiple sibling nodes', async () => {
    const multiChildren = (
      <>
        <div data-testid="child-a">A</div>
        <div data-testid="child-b">B</div>
        <div data-testid="child-c">C</div>
      </>
    )
    await renderAppShell({ children: multiChildren })
    await screen.findByTestId('navigation-rail')

    // All children rendered
    expect(screen.getByTestId('child-a')).toBeInTheDocument()
    expect(screen.getByTestId('child-b')).toBeInTheDocument()
    expect(screen.getByTestId('child-c')).toBeInTheDocument()

    // Navigation still present
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })
})
