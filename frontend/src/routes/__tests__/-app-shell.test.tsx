import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  createRouter,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import { Route as AppRoute } from '../_app'
import { Route as ClientesRoute } from '../_app/clientes'
import { Route as ContactosRoute } from '../_app/contactos'
import { Route as SplatRoute } from '../$'
import { Route as IndexRoute } from '../index'

// Mock siesa-ui-kit to avoid CSS/DOM issues in test environment
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

describe('App Shell — Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders app-shell wrapper on /clientes route', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    expect(screen.getByTestId('app-shell')).toBeDefined()
  })

  it('renders clientes view with correct testid', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    // Both desktop and mobile render the Outlet, so getAllByTestId is used
    const views = screen.getAllByTestId('clientes-view')
    expect(views.length).toBeGreaterThan(0)
  })

  it('renders contactos view with correct testid', async () => {
    const router = buildRouter('/contactos')
    await router.load()
    render(<RouterProvider router={router} />)
    const views = screen.getAllByTestId('contactos-view')
    expect(views.length).toBeGreaterThan(0)
  })

  it('renders NavigationRail desktop nav with Clientes and Contactos', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    expect(screen.getByTestId('nav-item-clientes')).toBeDefined()
    expect(screen.getByTestId('nav-item-contactos')).toBeDefined()
  })

  it('renders NavigationBar for mobile nav', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    expect(screen.getByTestId('navigation-bar')).toBeDefined()
    expect(screen.getByTestId('mobile-nav-item-clientes')).toBeDefined()
    expect(screen.getByTestId('mobile-nav-item-contactos')).toBeDefined()
  })

  it('marks Clientes as active when on /clientes route', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    const navItem = screen.getByTestId('nav-item-clientes')
    expect(navItem.getAttribute('aria-current')).toBe('page')
  })

  it('marks Contactos as active when on /contactos route', async () => {
    const router = buildRouter('/contactos')
    await router.load()
    render(<RouterProvider router={router} />)
    const navItem = screen.getByTestId('nav-item-contactos')
    expect(navItem.getAttribute('aria-current')).toBe('page')
  })

  it('clicking Contactos navigation item navigates to /contactos', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    const contactosBtn = screen.getByTestId('nav-item-contactos')
    fireEvent.click(contactosBtn)
    await router.invalidate()
    expect(router.state.location.pathname).toBe('/contactos')
  })

  it('renders 404 page with Spanish message for unknown routes', async () => {
    const router = buildRouter('/ruta-inexistente')
    await router.load()
    render(<RouterProvider router={router} />)
    expect(screen.getByTestId('not-found-view')).toBeDefined()
    expect(screen.getByText('Página no encontrada')).toBeDefined()
  })

  it('renders link back to /clientes on 404 page', async () => {
    const router = buildRouter('/ruta-inexistente')
    await router.load()
    render(<RouterProvider router={router} />)
    const link = screen.getByText('Ir a Clientes')
    expect(link).toBeDefined()
  })

  it('root / redirects to /clientes', async () => {
    const router = buildRouter('/')
    await router.load()
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('navigation items have accessible aria-label in Spanish', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    // Both desktop and mobile nav render, so getAllByRole is used
    const clientesBtns = screen.getAllByRole('button', { name: 'Clientes' })
    const contactosBtns = screen.getAllByRole('button', { name: 'Contactos' })
    expect(clientesBtns.length).toBeGreaterThan(0)
    expect(contactosBtns.length).toBeGreaterThan(0)
  })

  it('navigation landmark has aria-label "Navegación principal"', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    const navLandmarks = screen.getAllByRole('navigation', { name: 'Navegación principal' })
    expect(navLandmarks.length).toBeGreaterThan(0)
  })

  it('clicking mobile Contactos item navigates to /contactos', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    const mobileContactosBtn = screen.getByTestId('mobile-nav-item-contactos')
    fireEvent.click(mobileContactosBtn)
    await router.invalidate()
    expect(router.state.location.pathname).toBe('/contactos')
  })

  it('clicking mobile Clientes item navigates to /clientes from contactos', async () => {
    const router = buildRouter('/contactos')
    await router.load()
    render(<RouterProvider router={router} />)
    const mobileClientesBtn = screen.getByTestId('mobile-nav-item-clientes')
    fireEvent.click(mobileClientesBtn)
    await router.invalidate()
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('mobile nav bar onItemClick fires navigation', async () => {
    const router = buildRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)
    const navBar = screen.getByTestId('navigation-bar')
    const contactosBtn = navBar.querySelector('[data-testid="mobile-nav-item-contactos"]')
    expect(contactosBtn).not.toBeNull()
    fireEvent.click(contactosBtn!)
    await router.invalidate()
    expect(router.state.location.pathname).toBe('/contactos')
  })
})
