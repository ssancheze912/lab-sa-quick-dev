import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  createMemoryHistory,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { LayoutBase } from 'siesa-ui-kit'
import { UsersIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'

// ─── Inline components mirroring __root.tsx ───────────────────────────────────

function RootLayout() {
  const navigate = useNavigate()
  const { location } = useRouterState()

  const navItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-5 h-5" aria-label="Clientes" />,
      active: location.pathname.startsWith('/clientes'),
      onClick: () => void navigate({ to: '/clientes' }),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-5 h-5" aria-label="Contactos" />,
      active: location.pathname.startsWith('/contactos'),
      onClick: () => void navigate({ to: '/contactos' }),
    },
  ]

  return (
    <LayoutBase productName="Siesa Agents" navigationItems={navItems} contentClassName="p-0">
      <Outlet />
    </LayoutBase>
  )
}

function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div data-testid="not-found-page">
      <ExclamationTriangleIcon data-testid="exclamation-icon" className="w-16 h-16 text-amber-400" />
      <h1>Página no encontrada</h1>
      <p>La ruta que buscas no existe.</p>
      <button
        type="button"
        aria-label="Volver al inicio"
        onClick={() => void navigate({ to: '/clientes' })}
      >
        Volver al inicio
      </button>
    </div>
  )
}

// ─── Test router factory ──────────────────────────────────────────────────────

function buildTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })

  const rootRoute = createRootRoute({
    component: RootLayout,
    notFoundComponent: NotFoundPage,
  })

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => {
      throw redirect({ to: '/clientes' })
    },
  })

  const appRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_app',
    component: Outlet,
  })

  const clientesRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/clientes',
    component: () => (
      <div data-testid="clientes-placeholder">
        <p>Vista de Clientes — en construcción</p>
      </div>
    ),
  })

  const contactosRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/contactos',
    component: () => (
      <div data-testid="contactos-placeholder">
        <p>Vista de Contactos — en construcción</p>
      </div>
    ),
  })

  const routeTree = rootRoute.addChildren([
    indexRoute,
    appRoute.addChildren([clientesRoute, contactosRoute]),
  ])

  return createRouter({ routeTree, history })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RootLayout — NavigationRail', () => {
  it('renders NavigationRail with Clientes and Contactos entries', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // siesa-ui-kit NavigationRail renders nav items with data-testid="navigation-rail-item-{id}"
    await screen.findByTestId('navigation-rail-item-clientes')
    expect(screen.getByTestId('navigation-rail-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('navigation-rail-item-contactos')).toBeInTheDocument()
    // In collapsed mode, labels are rendered as aria-label attributes on the buttons
    expect(screen.getByRole('button', { name: 'Clientes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Contactos' })).toBeInTheDocument()
  })

  it('marks Clientes as active when on /clientes route', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('navigation-rail-item-clientes')

    // siesa-ui-kit applies aria-current="page" to active nav items
    expect(screen.getByTestId('navigation-rail-item-clientes')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('navigation-rail-item-contactos')).not.toHaveAttribute('aria-current', 'page')
  })

  it('marks Contactos as active when on /contactos route', async () => {
    const router = buildTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('navigation-rail-item-contactos')

    expect(screen.getByTestId('navigation-rail-item-contactos')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('navigation-rail-item-clientes')).not.toHaveAttribute('aria-current', 'page')
  })

  it('renders a navigation landmark', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('navigation-rail-item-clientes')

    // siesa-ui-kit NavigationRailGroup renders with data-testid="navigation-rail-group"
    expect(screen.getByTestId('navigation-rail-group')).toBeInTheDocument()
  })
})

describe('Route — /clientes placeholder', () => {
  it('renders the clientes placeholder view', async () => {
    const router = buildTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('clientes-placeholder')

    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument()
    expect(screen.getByText('Vista de Clientes — en construcción')).toBeInTheDocument()
  })
})

describe('Route — /contactos placeholder', () => {
  it('renders the contactos placeholder view', async () => {
    const router = buildTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('contactos-placeholder')

    expect(screen.getByTestId('contactos-placeholder')).toBeInTheDocument()
    expect(screen.getByText('Vista de Contactos — en construcción')).toBeInTheDocument()
  })
})

describe('Route — 404 Not Found', () => {
  it('renders NotFound page with Spanish heading for unknown routes', async () => {
    const router = buildTestRouter('/ruta-inexistente')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('not-found-page')

    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    expect(screen.getByText('La ruta que buscas no existe.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver al inicio' })).toBeInTheDocument()
  })

  it('renders the not-found container for unknown routes', async () => {
    const router = buildTestRouter('/abc')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('not-found-page')
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
  })
})

describe('Route — / redirect', () => {
  it('redirects from / to /clientes', async () => {
    const router = buildTestRouter('/')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('clientes-placeholder')
    expect(router.state.location.pathname).toBe('/clientes')
  })
})
