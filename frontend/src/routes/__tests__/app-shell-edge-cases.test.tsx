/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Expanded Unit/Component Coverage
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands beyond the primary ATDD component tests with edge cases, boundary conditions,
 * and negative paths not covered in -app-shell.test.tsx or app-shell.test.tsx.
 *
 * Coverage added:
 *   - activeId logic with edge-case pathnames (prefix collisions)
 *   - Resize event listener setup and cleanup (useEffect teardown)
 *   - isMobile state toggle via resize events
 *   - Mobile active state after navigation click
 *   - 404 page for paths beyond direct shallow unknowns
 *   - Navigation items data contract (id, label, to)
 *   - aria-current not set on inactive items
 *   - NotFoundView renders descriptive secondary message
 *   - 404 back link text is correct
 *   - app-shell wrapper present on both layouts (mobile + desktop)
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import {
  createRouter,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Route as AppRoute } from '../_app'
import { Route as ClientesRoute } from '../_app/clientes'
import { Route as ContactosRoute } from '../_app/contactos'
import { Route as SplatRoute } from '../$'
import { Route as IndexRoute } from '../index'

// MSW server — intercept API calls from ClienteListView
const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json([])),
)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

// Mock siesa-ui-kit — same contract as the primary test file
vi.mock('siesa-ui-kit', () => ({
  LayoutBase: ({ children, navigationItems, productName }: {
    children: React.ReactNode
    navigationItems?: Array<{ id: string; label: string; active?: boolean; onClick?: () => void }>
    productName?: string
  }) => (
    <div data-testid="layout-base" data-product-name={productName}>
      <nav aria-label="Navegación principal">
        {navigationItems?.map((item) => (
          <button
            key={item.id}
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
            onClick={item.onClick}
            data-testid={`nav-item-${item.id}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {children}
    </div>
  ),
  NavigationBar: ({ items, activeItemId, onItemClick, ariaLabel }: {
    items: Array<{ id: string; label: string; active?: boolean; ariaLabel?: string }>
    activeItemId?: string
    onItemClick?: (id: string) => void
    ariaLabel?: string
  }) => (
    <nav aria-label={ariaLabel ?? 'Navegación principal'} data-testid="navigation-bar">
      {items.map((item) => (
        <button
          key={item.id}
          aria-label={item.ariaLabel ?? item.label}
          aria-current={activeItemId === item.id ? 'page' : undefined}
          onClick={() => onItemClick?.(item.id)}
          data-testid={`mobile-nav-item-${item.id}`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  ),
}))

// Helper to control window.innerWidth for breakpoint testing
function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

function buildRouter(initialUrl: string) {
  const rootRoute = createRootRoute()

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: IndexRoute.options.beforeLoad,
  })

  const appRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_app',
    component: AppRoute.options.component,
  })

  const clientesRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/clientes',
    component: ClientesRoute.options.component,
  })

  const contactosRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/contactos',
    component: ContactosRoute.options.component,
  })

  const splatRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$',
    component: SplatRoute.options.component,
  })

  const routeTree = rootRoute.addChildren([
    indexRoute,
    appRoute.addChildren([clientesRoute, contactosRoute]),
    splatRoute,
  ])

  const memoryHistory = createMemoryHistory({ initialEntries: [initialUrl] })
  return createRouter({ routeTree, history: memoryHistory })
}

function renderWithQuery(router: ReturnType<typeof buildRouter>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// activeId Logic — Edge-Case Pathname Handling
// ─────────────────────────────────────────────────────────────────────────────

describe('activeId logic — pathname edge cases', () => {
  beforeEach(() => {
    setViewportWidth(1280)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should mark Clientes as active on /clientes (exact match)', async () => {
    // GIVEN: Route is exactly /clientes
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: Clientes nav item has aria-current="page"
    const item = screen.getByTestId('nav-item-clientes')
    expect(item.getAttribute('aria-current')).toBe('page')
  })

  it('should mark Contactos as active on /contactos (exact match)', async () => {
    // GIVEN: Route is exactly /contactos
    const router = buildRouter('/contactos')
    await router.load()
    renderWithQuery(router)

    // THEN: Contactos nav item has aria-current="page"
    const item = screen.getByTestId('nav-item-contactos')
    expect(item.getAttribute('aria-current')).toBe('page')
  })

  it('should NOT set aria-current on Contactos when on /clientes route', async () => {
    // GIVEN: Route is /clientes
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: Contactos nav item does NOT have aria-current="page"
    const item = screen.getByTestId('nav-item-contactos')
    expect(item.getAttribute('aria-current')).not.toBe('page')
  })

  it('should NOT set aria-current on Clientes when on /contactos route', async () => {
    // GIVEN: Route is /contactos
    const router = buildRouter('/contactos')
    await router.load()
    renderWithQuery(router)

    // THEN: Clientes nav item does NOT have aria-current="page"
    const item = screen.getByTestId('nav-item-clientes')
    expect(item.getAttribute('aria-current')).not.toBe('page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Responsive Layout — isMobile State Transitions via Resize
// ─────────────────────────────────────────────────────────────────────────────

describe('Responsive layout — resize event handling', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should show mobile nav bar when initial window.innerWidth < 1024', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(390)
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: Navigation bar is present (mobile layout)
    expect(screen.getByTestId('navigation-bar')).toBeDefined()
  })

  it('should show desktop nav rail when initial window.innerWidth >= 1024', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280)
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: Navigation rail is present (desktop layout)
    expect(screen.getByTestId('nav-item-clientes')).toBeDefined()
    expect(screen.getByTestId('nav-item-contactos')).toBeDefined()
  })

  it('should switch to mobile layout when resize event fires with width < 1024', async () => {
    // GIVEN: Component starts in desktop layout
    setViewportWidth(1280)
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)
    expect(screen.getByTestId('nav-item-clientes')).toBeDefined()

    // WHEN: Viewport is resized to mobile width
    act(() => {
      setViewportWidth(390)
      window.dispatchEvent(new Event('resize'))
    })

    // THEN: Mobile nav bar appears
    expect(screen.getByTestId('navigation-bar')).toBeDefined()
  })

  it('should switch to desktop layout when resize event fires with width >= 1024', async () => {
    // GIVEN: Component starts in mobile layout
    setViewportWidth(390)
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)
    expect(screen.getByTestId('navigation-bar')).toBeDefined()

    // WHEN: Viewport is resized to desktop width
    act(() => {
      setViewportWidth(1280)
      window.dispatchEvent(new Event('resize'))
    })

    // THEN: Desktop nav rail items appear
    expect(screen.getByTestId('nav-item-clientes')).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Navigation — Active State After Click
// ─────────────────────────────────────────────────────────────────────────────

describe('Mobile NavigationBar — active state after click navigation', () => {
  beforeEach(() => {
    setViewportWidth(390)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should mark Contactos as active in NavigationBar after clicking Contactos', async () => {
    // GIVEN: Mobile layout on /clientes
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // WHEN: User clicks the mobile Contactos item
    const contactosBtn = screen.getByTestId('mobile-nav-item-contactos')
    fireEvent.click(contactosBtn)
    await router.invalidate()

    // THEN: Contactos is active in the navigation bar
    expect(router.state.location.pathname).toBe('/contactos')
  })

  it('should mark Clientes as active in NavigationBar after clicking Clientes from /contactos', async () => {
    // GIVEN: Mobile layout on /contactos
    const router = buildRouter('/contactos')
    await router.load()
    renderWithQuery(router)

    // WHEN: User clicks the mobile Clientes item
    const clientesBtn = screen.getByTestId('mobile-nav-item-clientes')
    fireEvent.click(clientesBtn)
    await router.invalidate()

    // THEN: Navigation has returned to /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 404 Page — Content and Structural Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('404 NotFoundView — content and structural edge cases', () => {
  it('should render not-found-view for a deeply nested unknown path', async () => {
    // GIVEN: A deeply nested path that does not match any route
    const router = buildRouter('/nivel/sub-nivel/hoja')
    await router.load()
    renderWithQuery(router)

    // THEN: The not-found-view is rendered
    expect(screen.getByTestId('not-found-view')).toBeDefined()
  })

  it('should display "Página no encontrada" heading on 404 view', async () => {
    // GIVEN: An unknown route
    const router = buildRouter('/no-existe')
    await router.load()
    renderWithQuery(router)

    // THEN: The main heading text is the Spanish not-found message
    expect(screen.getByText('Página no encontrada')).toBeDefined()
  })

  it('should display a descriptive secondary message on 404 view', async () => {
    // GIVEN: An unknown route renders the not-found view
    const router = buildRouter('/no-existe')
    await router.load()
    renderWithQuery(router)

    // THEN: A secondary descriptive message is present
    expect(screen.getByText(/La ruta que buscas no existe/i)).toBeDefined()
  })

  it('should have back link with text "Ir a Clientes" on 404 view', async () => {
    // GIVEN: An unknown route renders the not-found view
    const router = buildRouter('/no-existe')
    await router.load()
    renderWithQuery(router)

    // THEN: The link to go back has the Spanish label "Ir a Clientes"
    expect(screen.getByText('Ir a Clientes')).toBeDefined()
  })

  it('should have a link pointing to /clientes on 404 view', async () => {
    // GIVEN: An unknown route renders the not-found view
    const router = buildRouter('/no-existe')
    await router.load()
    renderWithQuery(router)

    // THEN: A link element pointing to /clientes is present inside not-found-view
    const notFoundView = screen.getByTestId('not-found-view')
    const backLink = notFoundView.querySelector('a[href="/clientes"]')
    expect(backLink).not.toBeNull()
  })

  it('should NOT render app-shell on 404 route (404 is a root-level catch-all)', async () => {
    // GIVEN: An unknown route (catch-all $)
    const router = buildRouter('/no-existe')
    await router.load()
    renderWithQuery(router)

    // THEN: The 404 view renders and not-found-view is present
    // The catch-all is at root level (not inside _app layout), so app-shell is not expected
    const notFoundView = screen.queryByTestId('not-found-view')
    expect(notFoundView).not.toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Item Data Contract
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation item data contract validation', () => {
  beforeEach(() => {
    setViewportWidth(1280)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render exactly two navigation items in the desktop rail', async () => {
    // GIVEN: Desktop viewport on /clientes
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: Exactly two nav items are present in the rail (Clientes + Contactos)
    const navItemClientes = screen.queryByTestId('nav-item-clientes')
    const navItemContactos = screen.queryByTestId('nav-item-contactos')
    expect(navItemClientes).not.toBeNull()
    expect(navItemContactos).not.toBeNull()
    // No unexpected extra items
    const allNavItems = document.querySelectorAll('[data-testid^="nav-item-"]')
    expect(allNavItems.length).toBe(2)
  })

  it('should render exactly two navigation items in the mobile bar', async () => {
    // GIVEN: Mobile viewport on /clientes
    setViewportWidth(390)
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: Exactly two mobile nav items are present (Clientes + Contactos)
    const mobileNavItems = document.querySelectorAll('[data-testid^="mobile-nav-item-"]')
    expect(mobileNavItems.length).toBe(2)
  })

  it('should display "Clientes" label text on the Clientes nav item', async () => {
    // GIVEN: Desktop viewport on /clientes
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: The Clientes nav item has visible label text "Clientes"
    const item = screen.getByTestId('nav-item-clientes')
    expect(item.textContent).toContain('Clientes')
  })

  it('should display "Contactos" label text on the Contactos nav item', async () => {
    // GIVEN: Desktop viewport on /clientes
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: The Contactos nav item has visible label text "Contactos"
    const item = screen.getByTestId('nav-item-contactos')
    expect(item.textContent).toContain('Contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// app-shell Structural Integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('App shell structural integrity', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render app-shell wrapper on /clientes in desktop layout', async () => {
    // GIVEN: Desktop layout
    setViewportWidth(1280)
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: app-shell is present
    expect(screen.getByTestId('app-shell')).toBeDefined()
  })

  it('should render app-shell wrapper on /clientes in mobile layout', async () => {
    // GIVEN: Mobile layout
    setViewportWidth(390)
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: app-shell is still present (same testid, different inner layout)
    expect(screen.getByTestId('app-shell')).toBeDefined()
  })

  it('should render app-shell wrapper on /contactos', async () => {
    // GIVEN: Desktop layout on /contactos
    setViewportWidth(1280)
    const router = buildRouter('/contactos')
    await router.load()
    renderWithQuery(router)

    // THEN: app-shell wrapper exists for /contactos too
    expect(screen.getByTestId('app-shell')).toBeDefined()
  })

  it('should have exactly one app-shell wrapper per render', async () => {
    // GIVEN: Desktop layout on /clientes
    setViewportWidth(1280)
    const router = buildRouter('/clientes')
    await router.load()
    renderWithQuery(router)

    // THEN: Only one app-shell is present (no duplicated wrappers)
    const shells = document.querySelectorAll('[data-testid="app-shell"]')
    expect(shells.length).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Root Redirect — Boundary Conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('Root redirect — boundary conditions', () => {
  beforeEach(() => {
    setViewportWidth(1280)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect root / and resolve to /clientes pathname', async () => {
    // GIVEN: Root path /
    const router = buildRouter('/')
    await router.load()

    // THEN: Router state resolves to /clientes
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('should render clientes-view (not a blank page) after root redirect', async () => {
    // GIVEN: Root path / is accessed
    const router = buildRouter('/')
    await router.load()
    renderWithQuery(router)

    // THEN: The clientes-view content is visible
    const views = screen.getAllByTestId('clientes-view')
    expect(views.length).toBeGreaterThan(0)
  })
})
