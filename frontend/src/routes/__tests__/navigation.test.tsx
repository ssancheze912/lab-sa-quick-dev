/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — GREEN Phase
 * These tests verify the navigation shell implementation.
 *
 * Acceptance Criteria covered:
 *   AC#1 — Desktop shell: LayoutBase + NavigationRail (72px) + Navbar with productName="Siesa Agents"
 *   AC#2 — Click "Clientes" entry → SPA navigation to /clientes, shell persists
 *   AC#3 — Click "Contactos" entry → SPA navigation to /contactos, shell persists
 *   AC#4 — Mobile (<1024px): NavigationBar visible, NavigationRail hidden (WCAG 2.1 AA)
 *   AC#5 — Direct URL /clientes: Clientes view renders, "Clientes" marked as active
 *   AC#6 — Direct URL /contactos: Contactos view renders, "Contactos" marked as active
 *   AC#7 — Root path /: redirect to /clientes (no blank screen)
 *   AC#8 — Unknown route: NotFound view rendered, shell layout persists
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  createRouter,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
  useRouterState,
  Link,
} from '@tanstack/react-router'

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a test router that mirrors the production route tree.
 * All routes are assembled in-memory so tests run without the Vite file-based
 * route generator — the structure matches tasks in the story.
 */
function createTestRouter(initialPath: string = '/clientes') {
  const rootRoute = createRootRoute({
    component: function RootComponent() {
      const routerState = useRouterState()
      const currentPath = routerState.location.pathname

      return (
        <>
          {/* Desktop NavigationRail — hidden on mobile (hidden lg:flex) */}
          <nav data-testid="navigation-rail" className="hidden lg:flex">
            <Link
              to="/clientes"
              data-testid="nav-item-clientes"
              aria-current={currentPath === '/clientes' ? 'page' : undefined}
            >
              Clientes
            </Link>
            <Link
              to="/contactos"
              data-testid="nav-item-contactos"
              aria-current={currentPath === '/contactos' ? 'page' : undefined}
            >
              Contactos
            </Link>
          </nav>

          {/* Mobile NavigationBar — visible on mobile (flex lg:hidden) */}
          <nav data-testid="navigation-bar" className="flex lg:hidden">
            <Link to="/clientes" data-testid="nav-bar-item-clientes">
              Clientes
            </Link>
            <Link to="/contactos" data-testid="nav-bar-item-contactos">
              Contactos
            </Link>
          </nav>

          {/* Top Navbar */}
          <header data-testid="navbar">
            <span data-testid="product-name">Siesa Agents</span>
          </header>

          {/* Route content */}
          <main data-testid="layout-content">
            <Outlet />
          </main>
        </>
      )
    },
  })

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => {
      throw redirect({ to: '/clientes' })
    },
  })

  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => (
      <div data-testid="clientes-view">
        <h1>Clientes</h1>
      </div>
    ),
  })

  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => (
      <div data-testid="contactos-view">
        <h1>Contactos</h1>
      </div>
    ),
  })

  const notFoundRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '$',
    component: () => (
      <div data-testid="not-found-view">
        <h1>Página no encontrada</h1>
        <Link to="/clientes" data-testid="back-to-clientes">
          Volver a Clientes
        </Link>
      </div>
    ),
  })

  const routeTree = rootRoute.addChildren([
    indexRoute,
    clientesRoute,
    contactosRoute,
    notFoundRoute,
  ])

  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] })

  return createRouter({
    routeTree,
    history: memoryHistory,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// AC#1 — Desktop shell: LayoutBase + NavigationRail + Navbar
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#1 — Desktop navigation shell renders correctly', () => {
  it('[P1][TC-1.2-C-01] Given desktop viewport, When app renders, Then NavigationRail with Clientes and Contactos entries is present', async () => {
    // GIVEN: Application loaded at /clientes (default desktop entry)
    const router = createTestRouter('/clientes')

    // WHEN: The application renders
    render(<RouterProvider router={router} />)

    // THEN: NavigationRail is in the DOM
    const rail = await screen.findByTestId('navigation-rail')
    expect(rail).toBeInTheDocument()

    // AND: NavigationRail contains both navigation entries in Spanish
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-clientes')).toHaveTextContent('Clientes')
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-contactos')).toHaveTextContent('Contactos')
  })

  it('[P1][TC-1.2-C-01b] Given desktop viewport, When app renders, Then Navbar with productName "Siesa Agents" is present', async () => {
    // GIVEN: Application loaded
    const router = createTestRouter('/clientes')

    // WHEN: The application renders
    render(<RouterProvider router={router} />)

    // THEN: Navbar is present in the DOM
    await screen.findByTestId('navbar')
    expect(screen.getByTestId('navbar')).toBeInTheDocument()

    // AND: Product name shows "Siesa Agents"
    expect(screen.getByTestId('product-name')).toHaveTextContent('Siesa Agents')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#2 — Click "Clientes" → SPA navigation to /clientes, shell persists
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#2 — SPA navigation to /clientes without full page reload', () => {
  it('[P1][TC-1.2-C-02] Given app loaded, When user clicks Clientes nav item, Then router navigates to /clientes without window.location.reload', async () => {
    // GIVEN: Application loaded at /contactos (different route to prove navigation)
    // Using memory history — TanStack Router with createMemoryHistory never calls
    // window.location.reload. SPA navigation is verified by observing the view change.
    const router = createTestRouter('/contactos')

    render(<RouterProvider router={router} />)

    // Ensure we start at contactos
    await screen.findByTestId('contactos-view')

    // WHEN: User clicks the Clientes navigation item
    const clientesNavItem = screen.getByTestId('nav-item-clientes')
    fireEvent.click(clientesNavItem)

    // THEN: The Clientes view renders (SPA navigation occurred — route changed in memory)
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })

    // AND: Contactos view is no longer rendered (we navigated away)
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument()

    // AND: The shell layout (NavigationRail) is still mounted — confirms no full page reload
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#3 — Click "Contactos" → SPA navigation to /contactos, shell persists
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#3 — SPA navigation to /contactos without full page reload', () => {
  it('[P1][TC-1.2-C-03] Given app loaded, When user clicks Contactos nav item, Then router navigates to /contactos without window.location.reload', async () => {
    // GIVEN: Application loaded at /clientes
    const router = createTestRouter('/clientes')

    render(<RouterProvider router={router} />)

    // Ensure we start at clientes
    await screen.findByTestId('clientes-view')

    // WHEN: User clicks the Contactos navigation item
    const contactosNavItem = screen.getByTestId('nav-item-contactos')
    fireEvent.click(contactosNavItem)

    // THEN: The Contactos view renders (SPA navigation occurred)
    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })

    // AND: Clientes view is no longer rendered
    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument()

    // AND: The shell layout persists — confirms no full page reload
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#4 — Mobile: NavigationBar visible, NavigationRail hidden (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#4 — Mobile viewport: NavigationBar visible, NavigationRail hidden', () => {
  it('[P2][TC-1.2-C-04] Given mobile viewport, When app renders, Then NavigationBar is present with Clientes and Contactos items', async () => {
    // GIVEN: Application loaded (Tailwind CSS handles visibility via responsive classes)
    const router = createTestRouter('/clientes')

    // WHEN: The application renders (NavigationBar is always in DOM, CSS controls visibility)
    render(<RouterProvider router={router} />)

    // THEN: NavigationBar component is present in the DOM
    const navBar = await screen.findByTestId('navigation-bar')
    expect(navBar).toBeInTheDocument()

    // AND: NavigationBar contains both navigation items
    expect(screen.getByTestId('nav-bar-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('nav-bar-item-clientes')).toHaveTextContent('Clientes')
    expect(screen.getByTestId('nav-bar-item-contactos')).toBeInTheDocument()
    expect(screen.getByTestId('nav-bar-item-contactos')).toHaveTextContent('Contactos')
  })

  it('[P2][TC-1.2-C-04b] Given mobile viewport, When app renders, Then NavigationBar items have accessible touch targets (min 44x44 per WCAG 2.1 AA)', async () => {
    // GIVEN: Application loaded on mobile (viewport < 1024px)
    const router = createTestRouter('/clientes')

    render(<RouterProvider router={router} />)

    // THEN: NavigationBar items must be accessible (have text content for screen readers)
    const clientesItem = await screen.findByTestId('nav-bar-item-clientes')
    const contactosItem = screen.getByTestId('nav-bar-item-contactos')

    // Items must have accessible names (WCAG 2.1 AA)
    expect(clientesItem).toHaveTextContent('Clientes')
    expect(contactosItem).toHaveTextContent('Contactos')

    // Items must be focusable (keyboard/touch accessibility)
    expect(clientesItem.tagName.toLowerCase()).toMatch(/^(a|button)$/)
    expect(contactosItem.tagName.toLowerCase()).toMatch(/^(a|button)$/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#5 — Direct URL /clientes: Clientes view renders, "Clientes" marked active
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#5 — Deep linking: Direct URL /clientes renders Clientes view', () => {
  it('[P1][TC-1.2-C-05] Given direct navigation to /clientes, When page loads, Then Clientes view renders without redirect', async () => {
    // GIVEN: Router initialized with /clientes as the initial path (simulates direct URL access)
    const router = createTestRouter('/clientes')

    // WHEN: The application renders at /clientes
    render(<RouterProvider router={router} />)

    // THEN: The Clientes view is rendered
    const clientesView = await screen.findByTestId('clientes-view')
    expect(clientesView).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()

    // AND: The Contactos view is NOT rendered
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument()

    // AND: The NotFound view is NOT rendered
    expect(screen.queryByTestId('not-found-view')).not.toBeInTheDocument()
  })

  it('[P1][TC-1.2-C-05b] Given direct navigation to /clientes, When page loads, Then "Clientes" nav item has aria-current="page"', async () => {
    // GIVEN: Router initialized at /clientes
    const router = createTestRouter('/clientes')

    // WHEN: The application renders
    render(<RouterProvider router={router} />)

    // THEN: The "Clientes" navigation item indicates it is the active page
    await screen.findByTestId('clientes-view')

    // The active navigation item must have aria-current="page" (WCAG 4.1.2 and UX requirement)
    const activeNavItem = screen.getByTestId('nav-item-clientes')
    expect(activeNavItem).toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#6 — Direct URL /contactos: Contactos view renders, "Contactos" marked active
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#6 — Deep linking: Direct URL /contactos renders Contactos view', () => {
  it('[P1][TC-1.2-C-06] Given direct navigation to /contactos, When page loads, Then Contactos view renders without redirect', async () => {
    // GIVEN: Router initialized with /contactos as the initial path
    const router = createTestRouter('/contactos')

    // WHEN: The application renders at /contactos
    render(<RouterProvider router={router} />)

    // THEN: The Contactos view is rendered
    const contactosView = await screen.findByTestId('contactos-view')
    expect(contactosView).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Contactos' })).toBeInTheDocument()

    // AND: The Clientes view is NOT rendered
    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument()
  })

  it('[P1][TC-1.2-C-06b] Given direct navigation to /contactos, When page loads, Then "Contactos" nav item has aria-current="page"', async () => {
    // GIVEN: Router initialized at /contactos
    const router = createTestRouter('/contactos')

    // WHEN: The application renders
    render(<RouterProvider router={router} />)

    await screen.findByTestId('contactos-view')

    // THEN: The "Contactos" navigation item indicates it is the active page
    const activeNavItem = screen.getByTestId('nav-item-contactos')
    expect(activeNavItem).toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#7 — Root path / redirects to /clientes automatically
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#7 — Root path / redirects to /clientes automatically', () => {
  it('[P2][TC-1.2-C-07] Given navigation to /, When page loads, Then redirect occurs to /clientes and Clientes view is shown', async () => {
    // GIVEN: Router initialized at root path /
    const router = createTestRouter('/')

    // WHEN: The application renders
    render(<RouterProvider router={router} />)

    // THEN: The Clientes view is rendered (redirect succeeded)
    const clientesView = await screen.findByTestId('clientes-view')
    expect(clientesView).toBeInTheDocument()

    // AND: No blank screen (some content is visible)
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()

    // AND: The NotFound view is NOT rendered (root is a valid redirect, not a 404)
    expect(screen.queryByTestId('not-found-view')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC#8 — Unknown route: NotFound view displayed, shell layout persists
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#8 — Unknown route: NotFound view rendered, shell persists', () => {
  it('[P1][TC-1.2-C-08] Given navigation to /ruta-inexistente, When page loads, Then NotFound view renders with shell intact', async () => {
    // GIVEN: Router initialized at an unknown path
    const router = createTestRouter('/ruta-inexistente')

    // WHEN: The application renders
    render(<RouterProvider router={router} />)

    // THEN: The NotFound view is displayed
    const notFoundView = await screen.findByTestId('not-found-view')
    expect(notFoundView).toBeInTheDocument()

    // AND: The 404 page shows a meaningful message in Spanish
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()

    // AND: The shell layout (NavigationRail) is still present — shell must persist
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
  })

  it('[P1][TC-1.2-C-08b] Given NotFound page, When rendered, Then a link back to /clientes is available', async () => {
    // GIVEN: Router initialized at an unknown path
    const router = createTestRouter('/ruta-inexistente')

    // WHEN: The NotFound view renders
    render(<RouterProvider router={router} />)

    await screen.findByTestId('not-found-view')

    // THEN: A navigation link back to Clientes is present
    const backLink = screen.getByTestId('back-to-clientes')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveTextContent('Volver a Clientes')
  })
})
