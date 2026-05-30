/**
 * Component Tests — Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Test level: Component (Vitest + React Testing Library)
 * Status: RED — Tests fail until __root.tsx is fully implemented with:
 *   - LayoutBase + Navbar + NavigationRail/NavigationBar from siesa-ui-kit
 *   - data-testid attributes on all navigation elements
 *   - Responsive rendering (NavigationRail on desktop, NavigationBar on mobile)
 *   - Active state via useRouterState (data-active, aria-current)
 *   - 404 notFoundComponent in Spanish
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail visible on desktop with Clientes and Contactos entries
 *   AC2 — Active nav item updates when route changes
 *   AC3 — NavigationBar (bottom tab bar) shown on mobile viewport
 *   AC4 — /clientes route renders Clientes view; active state correct
 *   AC5 — /contactos route renders Contactos view; active state correct
 *   AC6 — Unknown routes display 404 view in Spanish with back link to /clientes
 *   AC7 — Root route / redirects to /clientes
 *   AC8 — LayoutBase with Navbar shows "Siesa Agents" across all routes
 */

import { render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a router with an in-memory history starting at the given URL.
 * This enables isolated component tests without a real browser.
 */
function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

/**
 * Renders the full app shell at the given route path.
 */
async function renderAt(path: string) {
  const router = createTestRouter(path)
  await router.load()
  return render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail on desktop renders with Clientes and Contactos
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail on desktop viewport', () => {
  test('Given app is rendered, When viewing the shell, Then NavigationRail is present in the DOM', async () => {
    // GIVEN: The root layout is rendered
    // WHEN: The app shell mounts at /clientes
    await renderAt('/clientes')

    // THEN: The NavigationRail element is present (will fail until data-testid="navigation-rail" is added)
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })

  test('Given app is rendered, When viewing the NavigationRail, Then Clientes entry is present', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Clientes nav item renders (will fail until data-testid="nav-item-clientes" is added)
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
  })

  test('Given app is rendered, When viewing the NavigationRail, Then Contactos entry is present', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Contactos nav item renders (will fail until data-testid="nav-item-contactos" is added)
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Active state updates on the active route
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Active navigation state', () => {
  test('Given route is /clientes, When NavigationRail renders, Then Clientes item has data-active="true"', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Clientes item has active attribute (will fail until active state logic is implemented)
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).toHaveAttribute('data-active', 'true')
  })

  test('Given route is /clientes, When NavigationRail renders, Then Contactos item does NOT have data-active="true"', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Contactos item is not active
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('data-active', 'true')
  })

  test('Given route is /contactos, When NavigationRail renders, Then Contactos item has data-active="true"', async () => {
    // GIVEN / WHEN
    await renderAt('/contactos')

    // THEN: Contactos item is active
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).toHaveAttribute('data-active', 'true')
  })

  test('Given route is /contactos, When NavigationRail renders, Then Clientes item does NOT have data-active="true"', async () => {
    // GIVEN / WHEN
    await renderAt('/contactos')

    // THEN: Clientes item is not active
    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).not.toHaveAttribute('data-active', 'true')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — NavigationBar on mobile (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — NavigationBar visible on mobile viewport', () => {
  beforeEach(() => {
    // Mock window.innerWidth below the lg breakpoint (1024px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    window.dispatchEvent(new Event('resize'))
  })

  afterEach(() => {
    // Restore default width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    })
  })

  test('Given mobile viewport (< 1024px), When app renders, Then NavigationBar is present in DOM', async () => {
    // GIVEN: Mobile viewport is active
    // WHEN: App renders
    await renderAt('/clientes')

    // THEN: NavigationBar element is present (will fail until data-testid="navigation-bar" is added)
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
  })

  test('Given mobile viewport, When NavigationBar renders, Then Clientes tab is present', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Mobile Clientes tab present (will fail until data-testid="nav-bar-item-clientes" is added)
    expect(screen.getByTestId('nav-bar-item-clientes')).toBeInTheDocument()
  })

  test('Given mobile viewport, When NavigationBar renders, Then Contactos tab is present', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Mobile Contactos tab present (will fail until data-testid="nav-bar-item-contactos" is added)
    expect(screen.getByTestId('nav-bar-item-contactos')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Deep linking to /clientes renders Clientes view
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Deep linking to /clientes', () => {
  test('Given user navigates directly to /clientes, When page loads, Then Clientes placeholder is rendered', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Clientes view renders (will fail until data-testid="clientes-placeholder" is added to clientes.tsx)
    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument()
  })

  test('Given user navigates directly to /clientes, When page loads, Then Clientes nav item is active', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Active state on Clientes
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Deep linking to /contactos renders Contactos view
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Deep linking to /contactos', () => {
  test('Given user navigates directly to /contactos, When page loads, Then Contactos placeholder is rendered', async () => {
    // GIVEN / WHEN
    await renderAt('/contactos')

    // THEN: Contactos view renders (will fail until data-testid="contactos-placeholder" is added to contactos.tsx)
    expect(screen.getByTestId('contactos-placeholder')).toBeInTheDocument()
  })

  test('Given user navigates directly to /contactos, When page loads, Then Contactos nav item is active', async () => {
    // GIVEN / WHEN
    await renderAt('/contactos')

    // THEN: Active state on Contactos
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Unknown routes show a 404 page in Spanish
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — 404 Not Found page for unknown routes', () => {
  test('Given user navigates to /ruta-inexistente, When page loads, Then not-found-page element is present', async () => {
    // GIVEN / WHEN
    await renderAt('/ruta-inexistente')

    // THEN: 404 page renders (will fail until notFoundComponent is added with data-testid="not-found-page")
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
  })

  test('Given user navigates to /unknown, When page loads, Then heading reads "Página no encontrada"', async () => {
    // GIVEN / WHEN
    await renderAt('/unknown')

    // THEN: Spanish heading (will fail until notFoundComponent uses correct text + testid)
    expect(screen.getByTestId('not-found-heading')).toHaveTextContent('Página no encontrada')
  })

  test('Given user is on 404 page, When viewing the page, Then a link back to /clientes is present', async () => {
    // GIVEN / WHEN
    await renderAt('/abc')

    // THEN: Back link to /clientes (will fail until data-testid="not-found-back-link" is added)
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/clientes')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Root route / redirects to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC7 — Root route / redirects to /clientes', () => {
  test('Given user navigates to /, When page loads, Then Clientes view is rendered (redirect fired)', async () => {
    // GIVEN / WHEN: Navigate to root
    await renderAt('/')

    // THEN: After redirect, Clientes placeholder is shown (will fail until redirect + placeholder data-testid exist)
    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument()
  })

  test('Given user navigates to /, When redirect fires, Then Clientes nav item is active', async () => {
    // GIVEN / WHEN
    await renderAt('/')

    // THEN: Clientes is the active item after redirect
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — App shell uses LayoutBase with Navbar and Siesa branding
// ─────────────────────────────────────────────────────────────────────────────

describe('AC8 — LayoutBase with Navbar and Siesa branding', () => {
  test('Given app shell renders, When any view is displayed, Then LayoutBase wrapper is present', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: layout-base element present (will fail until data-testid="layout-base" is added in LayoutBase usage)
    expect(screen.getByTestId('layout-base')).toBeInTheDocument()
  })

  test('Given app shell renders, When viewing Navbar, Then app-navbar element is present', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Navbar present (will fail until data-testid="app-navbar" is added)
    expect(screen.getByTestId('app-navbar')).toBeInTheDocument()
  })

  test('Given app shell renders, When viewing Navbar, Then product name "Siesa Agents" is displayed', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Product name text is shown (will fail until Navbar renders with productName="Siesa Agents")
    expect(screen.getByTestId('navbar-product-name')).toHaveTextContent('Siesa Agents')
  })

  test('Given app shell renders, When viewing Navbar, Then Siesa logo element is present', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Logo present (will fail until data-testid="navbar-logo" is added)
    expect(screen.getByTestId('navbar-logo')).toBeInTheDocument()
  })

  test('Given app renders on /contactos, When any view is displayed, Then Navbar remains visible', async () => {
    // GIVEN / WHEN
    await renderAt('/contactos')

    // THEN: Navbar is consistent across routes
    expect(screen.getByTestId('app-navbar')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — WCAG 2.1 AA compliance (referenced in AC1, AC3)
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — Navigation WCAG 2.1 AA', () => {
  test('Given app shell renders, When screen reader inspects nav, Then aria-label="Navegación principal" is set', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Nav wrapper has correct aria-label (will fail until aria-label is added to nav wrapper)
    const nav = screen.getByTestId('main-nav')
    expect(nav).toHaveAttribute('aria-label', 'Navegación principal')
  })

  test('Given route is /clientes, When screen reader inspects nav item, Then aria-current="page" on Clientes', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Active item has aria-current="page" (will fail until aria-current is added to active item)
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
  })

  test('Given route is /clientes, When screen reader inspects Contactos item, Then aria-current is NOT "page"', async () => {
    // GIVEN / WHEN
    await renderAt('/clientes')

    // THEN: Inactive item does not have aria-current="page"
    const contactosItem = screen.getByTestId('nav-item-contactos')
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
  })
})
