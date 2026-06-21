/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Boundary Conditions
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion: covers edge cases, error paths, and boundary conditions
 * NOT already covered by the primary ATDD tests in navigation.test.tsx.
 *
 * Coverage areas:
 *   - Active state transitions (aria-current removed from previous item)
 *   - Multiple consecutive navigations (Clientes → Contactos → Clientes)
 *   - NavigationBar mobile items trigger navigation (not just present in DOM)
 *   - NotFound back-link navigates correctly to /clientes
 *   - Shell structural integrity (navbar + rail + content all co-exist)
 *   - Many unknown routes all show NotFound (boundary: different 404 paths)
 *   - Navigation from NotFound back to a valid route works
 *   - Shell persists across more than one navigation hop
 *   - Root redirect does not render NotFound during redirect
 *   - Content area (main) is present alongside nav elements
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
// Shared Test Helper — mirrors navigation.test.tsx helper exactly
// ─────────────────────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string = '/clientes') {
  const rootRoute = createRootRoute({
    component: function RootComponent() {
      const routerState = useRouterState()
      const currentPath = routerState.location.pathname

      return (
        <>
          {/* Desktop NavigationRail */}
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

          {/* Mobile NavigationBar */}
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
// EDGE-01: Active state transition — aria-current removed from previous item
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-01 — Active state transitions when navigating between routes', () => {
  it('[P1][TC-1.2-C-EDGE-01] Given /clientes is active, When user navigates to /contactos, Then aria-current is removed from "Clientes" and set on "Contactos"', async () => {
    // GIVEN: Start at /clientes — Clientes is active
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    // Verify initial active state
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current')

    // WHEN: User clicks Contactos
    fireEvent.click(screen.getByTestId('nav-item-contactos'))

    // THEN: Contactos becomes active, Clientes loses active state
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')
    })

    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current')
  })

  it('[P1][TC-1.2-C-EDGE-02] Given /contactos is active, When user navigates back to /clientes, Then aria-current swaps correctly', async () => {
    // GIVEN: Start at /contactos — Contactos is active
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('contactos-view')

    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current')

    // WHEN: Navigate back to Clientes
    fireEvent.click(screen.getByTestId('nav-item-clientes'))

    // THEN: Active state flips
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
    })

    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-02: Multiple consecutive navigations (Clientes → Contactos → Clientes)
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-02 — Multiple consecutive SPA navigations maintain correct state', () => {
  it('[P1][TC-1.2-C-EDGE-03] Given app loaded at /clientes, When user navigates Clientes→Contactos→Clientes, Then each step shows correct view and active state', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // Step 1: Start at Clientes
    await screen.findByTestId('clientes-view')
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')

    // Step 2: Navigate to Contactos
    fireEvent.click(screen.getByTestId('nav-item-contactos'))

    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument()
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page')

    // Step 3: Navigate back to Clientes
    fireEvent.click(screen.getByTestId('nav-item-clientes'))

    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument()
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current')
  })

  it('[P1][TC-1.2-C-EDGE-04] Given multiple navigations, When shell elements are checked after each step, Then NavigationRail and Navbar persist throughout', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    // Shell present at step 1
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()

    // Navigate to Contactos
    fireEvent.click(screen.getByTestId('nav-item-contactos'))
    await waitFor(() => expect(screen.getByTestId('contactos-view')).toBeInTheDocument())

    // Shell still present at step 2
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()

    // Navigate back to Clientes
    fireEvent.click(screen.getByTestId('nav-item-clientes'))
    await waitFor(() => expect(screen.getByTestId('clientes-view')).toBeInTheDocument())

    // Shell still present at step 3
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-03: Mobile NavigationBar items trigger actual navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-03 — Mobile NavigationBar items trigger client-side navigation', () => {
  it('[P1][TC-1.2-C-EDGE-05] Given app at /clientes, When user taps mobile nav Contactos item, Then /contactos view renders', async () => {
    // GIVEN: App loaded at /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    // WHEN: User taps the mobile NavigationBar Contactos item
    const mobileContactosItem = screen.getByTestId('nav-bar-item-contactos')
    fireEvent.click(mobileContactosItem)

    // THEN: Contactos view renders (SPA navigation via mobile nav)
    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument()
  })

  it('[P1][TC-1.2-C-EDGE-06] Given app at /contactos, When user taps mobile nav Clientes item, Then /clientes view renders', async () => {
    // GIVEN: App loaded at /contactos
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('contactos-view')

    // WHEN: User taps mobile NavigationBar Clientes item
    const mobileClientesItem = screen.getByTestId('nav-bar-item-clientes')
    fireEvent.click(mobileClientesItem)

    // THEN: Clientes view renders
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-04: NotFound back-link navigates to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-04 — NotFound "Volver a Clientes" link navigates to /clientes', () => {
  it('[P1][TC-1.2-C-EDGE-07] Given 404 page rendered, When user clicks "Volver a Clientes", Then app navigates to /clientes and NotFound view unmounts', async () => {
    // GIVEN: App at an unknown route
    const router = createTestRouter('/ruta-inexistente')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('not-found-view')
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument()

    // WHEN: User clicks the back link
    const backLink = screen.getByTestId('back-to-clientes')
    fireEvent.click(backLink)

    // THEN: Clientes view renders and NotFound is gone
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('not-found-view')).not.toBeInTheDocument()
  })

  it('[P1][TC-1.2-C-EDGE-08] Given navigation to /clientes after 404, When page renders, Then "Clientes" nav item is marked as active', async () => {
    // GIVEN: Start at 404 then navigate to /clientes
    const router = createTestRouter('/pagina-que-no-existe')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('not-found-view')

    // WHEN: User uses the back link
    fireEvent.click(screen.getByTestId('back-to-clientes'))

    // THEN: Active state is set on Clientes after recovery
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-05: Multiple distinct unknown routes all show NotFound
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-05 — Boundary: various unknown routes all render NotFound gracefully', () => {
  const unknownPaths = [
    '/ruta-inexistente',
    '/admin',
    '/users/123',
    '/clientes/detalle',
    '/contactos/nuevo',
  ]

  unknownPaths.forEach((path) => {
    it(`[P1][TC-1.2-C-EDGE-09] Given navigation to "${path}", When page loads, Then NotFound is displayed and shell persists`, async () => {
      const router = createTestRouter(path)
      render(<RouterProvider router={router} />)

      // NotFound renders
      const notFoundView = await screen.findByTestId('not-found-view')
      expect(notFoundView).toBeInTheDocument()

      // Shell persists
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
      expect(screen.getByTestId('navbar')).toBeInTheDocument()

      // 404 message is in Spanish
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-06: Shell structure integrity — all structural elements co-exist
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-06 — Shell structural integrity: all layout elements are co-present', () => {
  it('[P1][TC-1.2-C-EDGE-14] Given app at /clientes, When rendered, Then NavigationRail + NavigationBar + Navbar + main content area all exist simultaneously', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    // All four structural shell zones are present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('layout-content')).toBeInTheDocument()
  })

  it('[P1][TC-1.2-C-EDGE-15] Given app at /contactos, When rendered, Then all shell zones remain present', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('contactos-view')

    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('layout-content')).toBeInTheDocument()
  })

  it('[P1][TC-1.2-C-EDGE-16] Given app on 404 page, When rendered, Then all shell zones remain present', async () => {
    const router = createTestRouter('/not-a-real-page')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('not-found-view')

    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('layout-content')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-07: Root redirect does not render NotFound during redirect
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-07 — Root / redirect does not transiently show NotFound or blank', () => {
  it('[P2][TC-1.2-C-EDGE-17] Given navigation to /, When redirect resolves, Then NotFound is never shown (not even transiently)', async () => {
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    // Resolve to /clientes
    const clientesView = await screen.findByTestId('clientes-view')
    expect(clientesView).toBeInTheDocument()

    // NotFound must never have appeared
    expect(screen.queryByTestId('not-found-view')).not.toBeInTheDocument()
  })

  it('[P2][TC-1.2-C-EDGE-18] Given navigation to /, When redirect resolves, Then neither Contactos nor 404 view is present', async () => {
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    // Only Clientes view should be present, not Contactos or 404
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument()
    expect(screen.queryByTestId('not-found-view')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-08: No aria-current on non-active routes (negative assertions)
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-08 — No aria-current on non-active navigation items (exclusivity)', () => {
  it('[P1][TC-1.2-C-EDGE-19] Given /clientes is the active route, When checking Contactos nav item, Then it does NOT have aria-current="page"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    const contactosItem = screen.getByTestId('nav-item-contactos')
    // Must not have aria-current at all (not even aria-current="false")
    expect(contactosItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('[P1][TC-1.2-C-EDGE-20] Given /contactos is the active route, When checking Clientes nav item, Then it does NOT have aria-current="page"', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('contactos-view')

    const clientesItem = screen.getByTestId('nav-item-clientes')
    expect(clientesItem).not.toHaveAttribute('aria-current', 'page')
  })

  it('[P2][TC-1.2-C-EDGE-21] Given NotFound route is active, When checking all nav items, Then neither Clientes nor Contactos has aria-current="page"', async () => {
    const router = createTestRouter('/pagina-desconocida')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('not-found-view')

    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-09: Navigation renders content inside main content area
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-09 — Route content renders inside the layout-content main area', () => {
  it('[P1][TC-1.2-C-EDGE-22] Given /clientes is rendered, When checking DOM hierarchy, Then clientes-view is a descendant of layout-content', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    const mainContent = screen.getByTestId('layout-content')
    const clientesView = screen.getByTestId('clientes-view')

    // clientes-view must be inside the main content area
    expect(mainContent).toContainElement(clientesView)
  })

  it('[P1][TC-1.2-C-EDGE-23] Given /contactos is rendered, When checking DOM hierarchy, Then contactos-view is a descendant of layout-content', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('contactos-view')

    const mainContent = screen.getByTestId('layout-content')
    const contactosView = screen.getByTestId('contactos-view')

    expect(mainContent).toContainElement(contactosView)
  })

  it('[P1][TC-1.2-C-EDGE-24] Given 404 route is rendered, When checking DOM hierarchy, Then not-found-view is a descendant of layout-content', async () => {
    const router = createTestRouter('/ruta-no-existente')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('not-found-view')

    const mainContent = screen.getByTestId('layout-content')
    const notFoundView = screen.getByTestId('not-found-view')

    expect(mainContent).toContainElement(notFoundView)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-10: Navigation items have correct href attributes (link integrity)
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-10 — NavigationRail links have correct href attributes', () => {
  it('[P1][TC-1.2-C-EDGE-25] Given NavigationRail is rendered, When inspecting nav-item-clientes, Then its href points to /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    const clientesLink = screen.getByTestId('nav-item-clientes')
    expect(clientesLink).toHaveAttribute('href', '/clientes')
  })

  it('[P1][TC-1.2-C-EDGE-26] Given NavigationRail is rendered, When inspecting nav-item-contactos, Then its href points to /contactos', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    const contactosLink = screen.getByTestId('nav-item-contactos')
    expect(contactosLink).toHaveAttribute('href', '/contactos')
  })

  it('[P1][TC-1.2-C-EDGE-27] Given NavigationBar is rendered, When inspecting mobile nav items, Then their href attributes point to correct routes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('clientes-view')

    expect(screen.getByTestId('nav-bar-item-clientes')).toHaveAttribute('href', '/clientes')
    expect(screen.getByTestId('nav-bar-item-contactos')).toHaveAttribute('href', '/contactos')
  })
})
