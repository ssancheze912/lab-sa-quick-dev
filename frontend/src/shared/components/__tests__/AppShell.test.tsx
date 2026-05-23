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
 * Unit tests for AppShell component.
 *
 * Story 1.2 — Frontend Navigation Shell
 * Epic 1 — Project Foundation & Application Shell
 *
 * BMad-Integrated expansion — component-level coverage.
 * Covers: rendering of nav elements, active state logic, nav item presence,
 * ARIA labels, data-testid attributes, and children rendering.
 *
 * TanStack RouterProvider renders asynchronously; we use `act` + `findBy`
 * to wait for the router to settle before asserting.
 *
 * Test IDs: UNIT-AS-01 through UNIT-AS-14
 *
 * NOTE: AppShell uses useRouterState() from TanStack Router, so all tests
 * must wrap the component in a RouterProvider with a real in-memory router.
 */

afterEach(cleanup)

interface RenderOptions {
  path?: string
  children?: React.ReactNode
}

/**
 * Helper to render AppShell within a minimal TanStack Router at a given path.
 * Sets up in-memory history so we can control the active route.
 * Waits for the router to settle before returning.
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
  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-view">Contactos</div>,
  })
  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute])
  const history = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history })

  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<RouterProvider router={router} />)
    await router.load()
  })

  return result!
}

describe('AppShell — Navigation elements', () => {
  /**
   * UNIT-AS-01 (P0 — AC1)
   * NavigationRail element with data-testid="navigation-rail" is in the DOM.
   */
  it('UNIT-AS-01 — Renders element with data-testid="navigation-rail"', async () => {
    await renderAppShell()
    expect(await screen.findByTestId('navigation-rail')).toBeInTheDocument()
  })

  /**
   * UNIT-AS-02 (P0 — AC2)
   * NavigationBar element with data-testid="navigation-bar" is in the DOM.
   */
  it('UNIT-AS-02 — Renders element with data-testid="navigation-bar"', async () => {
    await renderAppShell()
    expect(await screen.findByTestId('navigation-bar')).toBeInTheDocument()
  })

  /**
   * UNIT-AS-03 (P0 — AC1)
   * NavigationRail has aria-label="Navegación principal" (Spanish, per dev notes).
   */
  it('UNIT-AS-03 — NavigationRail has aria-label="Navegación principal"', async () => {
    await renderAppShell()
    const rail = await screen.findByTestId('navigation-rail')
    expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
  })

  /**
   * UNIT-AS-04 (P0 — AC2)
   * NavigationBar has aria-label="Menú de navegación" (Spanish, per dev notes).
   */
  it('UNIT-AS-04 — NavigationBar has aria-label="Menú de navegación"', async () => {
    await renderAppShell()
    const bar = await screen.findByTestId('navigation-bar')
    expect(bar).toHaveAttribute('aria-label', 'Menú de navegación')
  })

  /**
   * UNIT-AS-05 (P0 — AC1)
   * Both "Clientes" and "Contactos" navigation links are rendered in the DOM.
   * (There are two of each — one in rail, one in bar — both should be present.)
   */
  it('UNIT-AS-05 — Renders Clientes and Contactos navigation links', async () => {
    await renderAppShell()
    // Wait for render to settle
    await screen.findByTestId('navigation-rail')

    // getAllByRole returns all matching links (rail + bar = 2 each)
    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    expect(clientesLinks.length).toBeGreaterThanOrEqual(1)
    expect(contactosLinks.length).toBeGreaterThanOrEqual(1)
  })
})

describe('AppShell — Active state logic', () => {
  /**
   * UNIT-AS-06 (P1 — AC1)
   * When the current path is /clientes, the Clientes link has aria-current="page".
   */
  it('UNIT-AS-06 — Clientes link has aria-current="page" when path is /clientes', async () => {
    await renderAppShell({ path: '/clientes' })
    await screen.findByTestId('navigation-rail')

    // Both rail and bar should have aria-current="page" on the Clientes link
    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    const activeLinks = clientesLinks.filter(
      (el) => el.getAttribute('aria-current') === 'page',
    )
    expect(activeLinks.length).toBeGreaterThanOrEqual(1)
  })

  /**
   * UNIT-AS-07 (P1 — AC1)
   * When the current path is /clientes, the Contactos link does NOT have aria-current="page".
   */
  it('UNIT-AS-07 — Contactos link does NOT have aria-current="page" when path is /clientes', async () => {
    await renderAppShell({ path: '/clientes' })
    await screen.findByTestId('navigation-rail')

    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    contactosLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current', 'page')
    })
  })

  /**
   * UNIT-AS-08 (P1 — AC1)
   * When the current path is /contactos, the Contactos link has aria-current="page".
   */
  it('UNIT-AS-08 — Contactos link has aria-current="page" when path is /contactos', async () => {
    await renderAppShell({ path: '/contactos' })
    await screen.findByTestId('navigation-rail')

    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    const activeLinks = contactosLinks.filter(
      (el) => el.getAttribute('aria-current') === 'page',
    )
    expect(activeLinks.length).toBeGreaterThanOrEqual(1)
  })

  /**
   * UNIT-AS-09 (P1 — AC1)
   * When the current path is /contactos, the Clientes link does NOT have aria-current="page".
   */
  it('UNIT-AS-09 — Clientes link does NOT have aria-current="page" when path is /contactos', async () => {
    await renderAppShell({ path: '/contactos' })
    await screen.findByTestId('navigation-rail')

    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    clientesLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current', 'page')
    })
  })
})

describe('AppShell — Navigation link hrefs', () => {
  /**
   * UNIT-AS-10 (P1 — AC1, FR28)
   * Clientes links have href="/clientes" (TanStack Router Link renders proper href).
   */
  it('UNIT-AS-10 — Clientes links have href="/clientes"', async () => {
    await renderAppShell()
    await screen.findByTestId('navigation-rail')

    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    clientesLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/clientes')
    })
  })

  /**
   * UNIT-AS-11 (P1 — AC1, FR28)
   * Contactos links have href="/contactos".
   */
  it('UNIT-AS-11 — Contactos links have href="/contactos"', async () => {
    await renderAppShell()
    await screen.findByTestId('navigation-rail')

    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    contactosLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/contactos')
    })
  })
})

describe('AppShell — Children and layout structure', () => {
  /**
   * UNIT-AS-12 (P0 — AC1)
   * AppShell renders its children in the main content area.
   */
  it('UNIT-AS-12 — Children are rendered inside AppShell', async () => {
    await renderAppShell({
      children: <span data-testid="child-content">Mi contenido</span>,
    })
    expect(await screen.findByTestId('child-content')).toBeInTheDocument()
  })

  /**
   * UNIT-AS-13 (P1 — AC1)
   * The NavigationRail nav element is a <nav> element.
   */
  it('UNIT-AS-13 — NavigationRail is a <nav> element', async () => {
    await renderAppShell()
    const rail = await screen.findByTestId('navigation-rail')
    expect(rail.tagName.toLowerCase()).toBe('nav')
  })

  /**
   * UNIT-AS-14 (P1 — AC2)
   * The NavigationBar nav element is a <nav> element.
   */
  it('UNIT-AS-14 — NavigationBar is a <nav> element', async () => {
    await renderAppShell()
    const bar = await screen.findByTestId('navigation-bar')
    expect(bar.tagName.toLowerCase()).toBe('nav')
  })
})
